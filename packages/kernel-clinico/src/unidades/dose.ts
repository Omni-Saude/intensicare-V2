/**
 * Normalizador de dose de vasopressores (ORQ-4) — canônico mcg/kg/min
 * (docs plan hemodynamics.md §4:288-323; razão de dose indexada a peso, com
 * a vasopressina como EXCEÇÃO explícita).
 *
 * - mcg/kg/h é borda ÷60; mg/kg/min é borda ×1000;
 * - mL/h NÃO é fator fixo: exige concentracao_farmaco (mg/mL) e peso
 *   validado (`PesoValidado` — número cru não compila, ver
 *   `./provas-de-tipo.ts`). Sem insumos, NÃO há dose: fail-closed HAZ-028;
 *   fórmula da spec (hemodynamics.md §4:294-296):
 *   (taxa × concentracao × 1000) / (peso × 60);
 * - vasopressina é U/min APENAS (U/h é borda ÷60): NUNCA indexada a peso,
 *   NUNCA coagida para outra unidade (hemodynamics.md §4:301-307).
 *
 * `normalizarDoseVasopressora` aplica a matriz categoria × unidade em ORDEM
 * fixa: (1) valor não finito → inválido; (2) incompatibilidade de categoria;
 * (3)/(4) conversão pela porta do domínio. Toda rejeição é resultado tipado —
 * nunca exceção.
 */

import type { PesoValidado } from "./peso.js";
import type { MarcaQuantidade, MotivoRejeicao, ResultadoQuantidade } from "./tipos.js";

export type DoseMcgKgMin = MarcaQuantidade<"DoseMcgKgMin">;
export type DoseUmin = MarcaQuantidade<"DoseUmin">;

/** Categorias clínicas: indexada a peso OU vasopressina em unidades (U/min). */
export type CategoriaVasopressora = "peso_indexada" | "vasopressina";

export type UnidadeDoseVasopressora =
  | "mcg/kg/min"
  | "mcg/kg/h"
  | "mg/kg/min"
  | "mL/h"
  | "U/min"
  | "U/h";

function convertido<T>(valor: T): ResultadoQuantidade<T> {
  return { status: "convertido", valor };
}

function rejeitado<T>(motivo: MotivoRejeicao, mensagem: string): ResultadoQuantidade<T> {
  return { status: "rejeitado", motivo, mensagem };
}

/** Borda ÷60: mcg/kg/h → canônico mcg/kg/min; exige finito ≥ 0. */
export function doseMcgKgMinDeMcgKgH(valor: number): ResultadoQuantidade<DoseMcgKgMin> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `dose em mcg/kg/h deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido((valor / 60) as DoseMcgKgMin);
}

/** Borda ×1000: mg/kg/min → canônico mcg/kg/min; exige finito ≥ 0. */
export function doseMcgKgMinDeMgKgMin(valor: number): ResultadoQuantidade<DoseMcgKgMin> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `dose em mg/kg/min deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido((valor * 1000) as DoseMcgKgMin);
}

/**
 * Fórmula da spec (hemodynamics.md §4:294-296): taxa de infusão em mL/h NÃO
 * é fator fixo — exige a concentração do fármaco (mg/mL) e o peso JÁ
 * validado (marca `PesoValidado`; número cru não compila). Insumos numéricos
 * finitos ≥ 0; caso contrário `rejected_valor_invalido` — NaN nunca sai de
 * um construtor marcado.
 */
export function doseMcgKgMinDeTaxaInfusao(entrada: {
  readonly taxaInfusaoMlH: number;
  readonly concentracaoFarmacoMgMl: number;
  readonly peso: PesoValidado;
}): ResultadoQuantidade<DoseMcgKgMin> {
  if (!Number.isFinite(entrada.taxaInfusaoMlH) || entrada.taxaInfusaoMlH < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `taxaInfusaoMlH deve ser número finito não negativo; recebido ${entrada.taxaInfusaoMlH}.`,
    );
  }
  if (!Number.isFinite(entrada.concentracaoFarmacoMgMl) || entrada.concentracaoFarmacoMgMl < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `concentracaoFarmacoMgMl deve ser número finito não negativo; recebido ${entrada.concentracaoFarmacoMgMl}.`,
    );
  }
  const dose =
    (entrada.taxaInfusaoMlH * entrada.concentracaoFarmacoMgMl * 1000) / (entrada.peso * 60);
  return convertido(dose as DoseMcgKgMin);
}

/** Borda ÷60: U/h → U/min; exige finito ≥ 0. */
export function doseUminDeUh(valor: number): ResultadoQuantidade<DoseUmin> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `dose em U/h deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido((valor / 60) as DoseUmin);
}

/** Porta canônica da vasopressina: U/min finito ≥ 0. */
export function doseUminDeUmin(valor: number): ResultadoQuantidade<DoseUmin> {
  if (!Number.isFinite(valor) || valor < 0) {
    return rejeitado(
      "rejected_valor_invalido",
      `dose em U/min deve ser número finito não negativo; recebido ${valor}.`,
    );
  }
  return convertido(valor as DoseUmin);
}

/**
 * Matriz categoria × unidade (hemodynamics.md §4:301-307), em ordem fixa:
 * (1) valor não finito → `rejected_valor_invalido`, ANTES da categoria;
 * (2) vasopressina + unidade indexada a peso/taxa ⇒ `rejected_categoria_
 * incompativel` (vasopressina é U/min APENAS — nunca coagida); peso_indexada
 * + U/min|U/h ⇒ mesmo motivo;
 * (3) vasopressina: U/min direto; U/h ÷60;
 * (4) peso_indexada: mcg/kg/min direto (finito ≥ 0); mcg/kg/h ÷60;
 * mg/kg/min ×1000; mL/h EXIGE concentracaoFarmacoMgMl (finita) e peso —
 * ausentes/inválidos ⇒ `rejected_missing_inputs` (o literal da spec, §4:301-
 * 305: peso ausente/inválido é exatamente isto), senão a fórmula da spec.
 */
export function normalizarDoseVasopressora(entrada: {
  readonly categoria: CategoriaVasopressora;
  readonly valor: number;
  readonly unidade: UnidadeDoseVasopressora;
  readonly concentracaoFarmacoMgMl?: number;
  readonly peso?: PesoValidado;
}): ResultadoQuantidade<DoseMcgKgMin | DoseUmin> {
  // (1) Valor não finito é inválido antes de qualquer checagem de categoria.
  if (!Number.isFinite(entrada.valor)) {
    return rejeitado(
      "rejected_valor_invalido",
      `valor da dose deve ser número finito; recebido ${entrada.valor}.`,
    );
  }

  // (2)+(3) Vasopressina: U/min APENAS (U/h é a borda ÷60).
  if (entrada.categoria === "vasopressina") {
    if (entrada.unidade === "U/min" || entrada.unidade === "U/h") {
      return entrada.unidade === "U/min"
        ? doseUminDeUmin(entrada.valor)
        : doseUminDeUh(entrada.valor);
    }
    return rejeitado(
      "rejected_categoria_incompativel",
      `vasopressina é dosada em U/min (borda U/h) — unidade "${entrada.unidade}" é incompatível; nunca indexada a peso nem coagida (hemodynamics.md §4:307).`,
    );
  }

  // (2) peso_indexada: unidades em unidades (U/min, U/h) só existem na via
  // vasopressina — categoria incompatível.
  if (entrada.unidade === "U/min" || entrada.unidade === "U/h") {
    return rejeitado(
      "rejected_categoria_incompativel",
      `unidade "${entrada.unidade}" só existe na via vasopressina — incompatível com dose indexada a peso.`,
    );
  }

  // (4) peso_indexada nas unidades canônica/bordas.
  switch (entrada.unidade) {
    case "mcg/kg/min":
      // Canônica direta: finito ≥ 0 (a finitude já veio da regra 1; a guarda
      // permanece como contrato explícito da porta).
      if (!Number.isFinite(entrada.valor) || entrada.valor < 0) {
        return rejeitado(
          "rejected_valor_invalido",
          `dose em mcg/kg/min deve ser número finito não negativo; recebido ${entrada.valor}.`,
        );
      }
      return convertido(entrada.valor as DoseMcgKgMin);
    case "mcg/kg/h":
      return doseMcgKgMinDeMcgKgH(entrada.valor);
    case "mg/kg/min":
      return doseMcgKgMinDeMgKgMin(entrada.valor);
    case "mL/h":
      // mL/h não é fator fixo: sem concentração do fármaco e peso validado,
      // NÃO há dose — `rejected_missing_inputs` é o literal da spec
      // (hemodynamics.md §4:301-305; fail-closed HAZ-028). Concentração NaN
      // é TRATADA COMO AUSENTE, nunca como zero.
      if (
        entrada.concentracaoFarmacoMgMl === undefined ||
        !Number.isFinite(entrada.concentracaoFarmacoMgMl) ||
        entrada.peso === undefined
      ) {
        return rejeitado(
          "rejected_missing_inputs",
          "dose em mL/h exige concentracaoFarmacoMgMl e peso validado — sem insumos NÃO há dose (HAZ-028).",
        );
      }
      return doseMcgKgMinDeTaxaInfusao({
        taxaInfusaoMlH: entrada.valor,
        concentracaoFarmacoMgMl: entrada.concentracaoFarmacoMgMl,
        peso: entrada.peso,
      });
  }
}
