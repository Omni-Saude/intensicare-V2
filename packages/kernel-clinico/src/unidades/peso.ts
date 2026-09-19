/**
 * Normalizador de peso (ORQ-4) — SYS-09: o parser legado DESCARTAVA o
 * separador decimal ("70,5"/"70.5" ⇒ 705 kg, dez vezes a dose de toda
 * terapia indexada a peso). Aqui o separador NUNCA é descartado:
 * - a porta numérica (`pesoDeNumeroKg`) só aceita número já finito dentro
 *   dos limites de plausibilidade;
 * - a porta de texto ascii (`pesoDeTextoAscii`) aceita PONTO decimal e
 *   rejeita vírgula com classe própria, apontando para o parser PT-BR;
 * - o parser PT-BR explícito (`parsePesoPtBr`) aceita vírgula OU ponto como
 *   separador decimal — no máximo um, tratado como decimal, sem agrupamento
 *   de milhar nesta fronteira.
 *
 * Fail-closed (HAZ-028): valor implausível nunca vira dose.
 */

import type { MarcaQuantidade, MotivoRejeicao, ResultadoQuantidade } from "./tipos.js";

export type PesoValidado = MarcaQuantidade<"PesoValidado">;

/**
 * Limites PROVISÓRIOS de plausibilidade, em kg — HAZ-021 está "(aberta)" na
 * spec, aguardando ratificação; escolhidos para conter o defeito registrado
 * 70,5 → 705 kg (SYS-09). Não ratificar antes de decisão documentada.
 */
export const PESO_KG_LIMITES_PLAUSIBILIDADE = { minimo: 0.5, maximo: 350 } as const;

/** Decimal ascii estrito: dígitos com no máximo um ponto decimal. */
const PADRAO_DECIMAL_ASCII = /^\d+(\.\d+)?$/;

function convertido<T>(valor: T): ResultadoQuantidade<T> {
  return { status: "convertido", valor };
}

function rejeitado<T>(motivo: MotivoRejeicao, mensagem: string): ResultadoQuantidade<T> {
  return { status: "rejeitado", motivo, mensagem };
}

/** Limites provisórios + marca — porta final comum às três entradas. */
function aplicarLimitesDePlausibilidade(kg: number): ResultadoQuantidade<PesoValidado> {
  if (!Number.isFinite(kg)) {
    return rejeitado("rejected_valor_invalido", `peso deve ser número finito; recebido ${kg}.`);
  }
  const { minimo, maximo } = PESO_KG_LIMITES_PLAUSIBILIDADE;
  if (kg < minimo || kg > maximo) {
    return rejeitado(
      "rejected_fora_da_faixa",
      `peso ${kg} kg fora dos limites provisórios de plausibilidade [${minimo}, ${maximo}] kg (HAZ-021 aberta).`,
    );
  }
  return convertido(kg as PesoValidado);
}

/** Porta numérica: não-finito ⇒ inválido; fora de [0.5, 350] kg ⇒ fora da faixa. */
export function pesoDeNumeroKg(valor: number): ResultadoQuantidade<PesoValidado> {
  return aplicarLimitesDePlausibilidade(valor);
}

/**
 * Porta de texto ascii — aceita SOMENTE `/^\d+(\.\d+)?$/` (ponto decimal).
 * Vírgula ⇒ `rejected_separador_virgula` com a mensagem apontando para o
 * parser PT-BR (`parsePesoPtBr`) — a vírgula nunca vaza para número aqui
 * (o defeito SYS-09 "70,5" → 705 morre nesta porta). Outro formato ⇒
 * `rejected_formato_invalido`. Depois, os limites de plausibilidade.
 */
export function pesoDeTextoAscii(texto: string): ResultadoQuantidade<PesoValidado> {
  if (texto.includes(",")) {
    return rejeitado(
      "rejected_separador_virgula",
      `vírgula decimal não é aceita na porta numérica — use parsePesoPtBr para texto PT-BR (o separador nunca é descartado); recebido "${texto}".`,
    );
  }
  if (!PADRAO_DECIMAL_ASCII.test(texto)) {
    return rejeitado(
      "rejected_formato_invalido",
      `peso deve ser decimal com ponto (ex.: "70.5"), sem espaços, sinal ou sufixo; recebido "${texto}".`,
    );
  }
  return aplicarLimitesDePlausibilidade(Number(texto));
}

/**
 * Parser PT-BR explícito: no máximo UM separador (vírgula OU ponto),
 * tratado como decimal — "70,5" ⇒ 70.5 e "70.5" ⇒ 70.5. Dois separadores
 * ("1.234,5") ⇒ `rejected_formato_invalido`: NÃO há agrupamento de milhar
 * nesta fronteira. Texto não numérico ⇒ `rejected_formato_invalido`. O
 * separador NUNCA é descartado (SYS-09). Depois, os limites de
 * plausibilidade.
 */
export function parsePesoPtBr(texto: string): ResultadoQuantidade<PesoValidado> {
  const totalSeparadores = (texto.match(/[.,]/g) ?? []).length;
  if (totalSeparadores > 1) {
    return rejeitado(
      "rejected_formato_invalido",
      `no máximo um separador decimal (vírgula ou ponto) — sem agrupamento de milhar nesta fronteira; recebido "${texto}".`,
    );
  }
  const normalizado = texto.replaceAll(",", ".");
  if (!PADRAO_DECIMAL_ASCII.test(normalizado)) {
    return rejeitado(
      "rejected_formato_invalido",
      `texto deve ser número decimal PT-BR (ex.: "70,5" ou "70.5"), sem espaços, sinal ou sufixo; recebido "${texto}".`,
    );
  }
  return aplicarLimitesDePlausibilidade(Number(normalizado));
}
