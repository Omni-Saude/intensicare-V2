/**
 * supressao-alertas.ts — PRIMITIVA PURA de higiene de alarmes (dedup por
 * chave + cooldown + teto de taxa por 24 h + janela de manutenção).
 *
 * Por que esta primitiva existe: sem ela, cada ingestão que atinge a
 * condição de gatilho cria um item de trabalho durável novo — a inundação
 * do canal é o mesmo defeito clínico do alerta estático de patamar
 * (PPV < 0,2 no crônico-alto de UTI). A primitiva é CONSULTIVA e PURA:
 * nenhum relógio é lido (todo instante entra por parâmetro), nenhum estado
 * é lembrado aqui (o estado por chave é lido pelo consumidor e entra como
 * parâmetro), nenhuma decisão clínica é tomada.
 *
 * COMPOSIÇÃO COM O GATILHO DE BORDA (kernel-clinico, `alertCrossing`): o
 * cruzamento (notícia nova) é veredito do KERNEL; o tempo entre emissões é
 * política DESTE módulo. O catálogo irmão (ALERT-EWS-NEWS2-DETERIORATION-01)
 * define cooldown PT4H que "re-arms only after the score drops below 7":
 * a queda abaixo de 7 é condição do CRUZAMENTO (news2_prev < 7 — kernel);
 * o PT4H é a janela mínima ENTRE emissões (este módulo). Um recruzamento
 * antes do fim do cooldown é suprimido com motivo explícito — nunca
 * silenciosamente: supressão sem trilha é o mesmo defeito de alerta sem
 * trilha.
 *
 * PREMISSA (reversível, pendente ratificação RAT-EWS): cooldown PT4H e
 * teto de 3 emissões/24 h/paciente são valores do catálogo irmão
 * (`suppression: dedup_key: patient_id+alert_id, cooldown: PT4H,
 * rate_limit: 3/24h/patient, maintenance_window_aware: true`) — premissas
 * de engenharia parametrizadas, JAMAIS números mágicos na lógica; a
 * ratificação clínica os decide definitivamente.
 *
 * Nenhuma alegação de efetividade clínica ou de conformidade regulatória
 * é feita por este módulo.
 */

/**
 * Cooldown padrão do alerta de deterioração NEWS2 (PT4H do catálogo irmão).
 * PREMISSA (reversível, pendente ratificação RAT-EWS).
 */
export const PREMISSA_COOLDOWN_NEWS2_MS = 4 * 60 * 60 * 1000;

/** Teto de emissões por 24 h rolantes (3/24h/patient do catálogo irmão). */
export const PREMISSA_TAXA_MAXIMA_NEWS2_24H = 3;

/** Janela rolante do teto de taxa, em milissegundos (24 h). */
export const JANELA_TAXA_MS = 24 * 60 * 60 * 1000;

/**
 * Política de supressão de um tipo de alerta. Cada valor é premissa de
 * engenharia documentada pelo chamador — este módulo não embute default
 * clínico nenhum.
 */
export interface PoliticaSupressaoAlerta {
  /** Intervalo mínimo entre emissões da mesma chave (ms). */
  readonly cooldownMs: number;
  /** Máximo de emissões por janela rolante de 24 h por chave. */
  readonly taxaMaxima24h: number;
  /**
   * `true` (catálogo: `maintenance_window_aware: true`) ⇒ o alerta É
   * suprimido dentro de uma janela de manutenção ativa. Alertas de
   * segurança-crítica passam `false` — atravessam janela de manutenção
   * (nunca são silenciados por ela).
   */
  readonly conscienteJanelaManutencao: boolean;
}

/**
 * Estado OBSERVADO da chave no instante da consulta, lido pelo consumidor
 * (no V2: leitura em-transação dos itens de trabalho/alertas existentes —
 * a primitiva nunca lê nem lembra nada).
 */
export interface EstadoChaveSupressao {
  /** Última emissão da chave (ms desde época); `null` ⇒ nunca emitiu. */
  readonly ultimoEmitMs: number | null;
  /**
   * Instantes (ms) das emissões conhecidas da chave. A primitiva FILTRA
   * pela janela rolante de 24 h ela própria (defesa em profundidade — um
   * consumidor que apresente emissões mais antigas não trava o teto para
   * sempre): contam somente `t` com `agoraMs - 24 h < t`.
   */
  readonly emitesMs24h: readonly number[];
}

/** Janela de manutenção ativa, em ms desde época (meio-aberta: [início, fim)). */
export interface JanelaManutencao {
  readonly inicioMs: number;
  readonly fimMs: number;
}

/**
 * Veredito da consulta. Suprimir SEMPRE carrega motivo legível por máquina
 * — o consumidor o audita; supressão silenciosa é o mesmo defeito de
 * alerta silencioso.
 */
export type VereditoSupressao =
  | { readonly tipo: "emitir" }
  | {
      readonly tipo: "suprimir";
      readonly motivo: "cooldown" | "taxa_24h" | "janela_de_manutencao";
    };

/**
 * Decide se uma emissão pode ocorrer AGORA para a chave.
 *
 * `chave` não participa do veredito — o estado já é por construção por
 * chave (catálogo irmão: `patient_id+alert_id`); viaja na assinatura para
 * que o registro de auditoria do consumidor cite a chave consultada.
 *
 * Ordem dos motivos (cada um mais específico que o seguinte):
 *   1. `janela_de_manutencao` — só se a política for consciente da janela;
 *      alerta de segurança-crítica (`conscienteJanelaManutencao: false`)
 *      ATRAVESSA a janela;
 *   2. `cooldown` — emissão anterior da chave dentro do intervalo mínimo;
 *   3. `taxa_24h` — teto de emissões da janela rolante já atingido
 *      (defesa em profundidade: mesmo com rearmamentos legítimos, o canal
 *      por paciente/chave tem teto diário);
 *   4. `emitir`.
 *
 * Fronteira do cooldown: `agoraMs >= ultimoEmitMs + cooldownMs` EMITE
 * (intervalo mínimo cumprido); estritamente antes, suprime.
 */
export function deveriaEmitirAlerta(
  chave: string,
  agoraMs: number,
  estado: EstadoChaveSupressao,
  politica: PoliticaSupressaoAlerta,
  janelaManutencao: JanelaManutencao | null,
): VereditoSupressao {
  void chave;

  if (
    janelaManutencao !== null &&
    politica.conscienteJanelaManutencao &&
    agoraMs >= janelaManutencao.inicioMs &&
    agoraMs < janelaManutencao.fimMs
  ) {
    return { tipo: "suprimir", motivo: "janela_de_manutencao" };
  }

  const { ultimoEmitMs, emitesMs24h } = estado;
  if (ultimoEmitMs !== null && agoraMs < ultimoEmitMs + politica.cooldownMs) {
    return { tipo: "suprimir", motivo: "cooldown" };
  }

  const emitesNaJanela = emitesMs24h.filter((t) => t > agoraMs - JANELA_TAXA_MS);
  if (emitesNaJanela.length >= politica.taxaMaxima24h) {
    return { tipo: "suprimir", motivo: "taxa_24h" };
  }

  return { tipo: "emitir" };
}
