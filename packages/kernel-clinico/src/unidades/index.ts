/**
 * Módulo de unidades do kernel clínico — piso aditivo criado para o RULE-SOFA
 * (extensão aditiva do escopo do ORQ-4, que não havia pousado; ver
 * ORCHESTRATION_PLAN §1: shared resources).
 *
 * LEI DO MÓDULO (spec de conversão, hemodynamics §4 do irmão como intenção
 * READ-ONLY; HAZ-0032): uma quantidade crua na fronteira de cálculo é um
 * erro; entrada não conversível é REJEITADA ALTO — nunca adivinhada. A
 * conversão acontece SOMENTE aqui; nenhum consumidor converte por conta
 * própria. Funções puras, sem I/O, sem relógio, sem exceção — rejeição é
 * RESULTADO TIPADO, nunca throw.
 *
 * Escopo DELIBERADO desta fatia (SOFA): FiO2 fração/percentual, PaO2
 * mm[Hg]/kPa, bilirrubina e creatinina mg/dL/µmol/L (fatores EXATOS pinados
 * na logic.yaml: ÷17.104 e ÷88.42 — OQ-6 (a)), plaquetas 10*3/uL ≡ 10*9/L e
 * taxas de dose ug/kg/min. O piso completo do ORQ-4 (lactato, peso com
 * vírgula decimal PT-BR, fórmula mL/h × concentração, provas de tipo) é
 * stream próprio com sua própria suíte.
 *
 * PREMISSA (reversível): quantidades em `ug/min` e `mL/h` são UNIDADES
 * RECONHECIDAS cuja normalização exige peso + concentração com política
 * VALIDATION REQUIRED (spec SOFA §3.1 linha 9) — este módulo NÃO inventa a
 * fórmula; o consumidor declara piso por presença do agente. Unidade fora
 * do conjunto reconhecido é INMAPEÁVEL (integridade, não ausência).
 */

/** Marca fantasma — um `number` cru jamais ocupa o lugar de uma quantidade convertida. */
declare const marcaQuantidade: unique symbol;

/** Fração de FiO2 em [0.21, 1.0] — o único valor que entra na razão P/F. */
export type Fio2Fracao = number & { readonly [marcaQuantidade]: "Fio2Fracao" };

/** Taxa de dose já normalizada em µg/kg/min — o único valor que entra em banda de vasopressor. */
export type DoseUgKgMin = number & { readonly [marcaQuantidade]: "DoseUgKgMin" };

/** Quantidade com unidade declarada; unidade vazia é AUSÊNCIA declarada, nunca implícita. */
export interface QuantidadeComUnidade {
  readonly value: number;
  readonly unit: string;
}

export type ConversaoFio2 =
  | { readonly ok: true; readonly fracao: Fio2Fracao; readonly convertido: boolean }
  | {
      readonly ok: false;
      /** `unidade_ausente` | `unidade_inmapeavel` | `fora_da_faixa` */
      readonly motivo: "unidade_ausente" | "unidade_inmapeavel" | "fora_da_faixa";
    };

const EPS = 1e-9;

/**
 * Converte FiO2 declarado para fração. `unit "1"` é a fração canônica;
 * `unit "%"` converte ÷100 (somente no intervalo legal 21–100); unidade
 * ausente é rejeitada SEM adivinhação — o valor 40 sem unidade jamais vira
 * 0,40 nem 40 (a catástrofe percent/fração das trilhas, CRV-SOFA-0330).
 */
export function paraFio2Fracao(q: QuantidadeComUnidade): ConversaoFio2 {
  if (!Number.isFinite(q.value)) return { ok: false, motivo: "fora_da_faixa" };
  if (q.unit === "1") {
    if (q.value >= 0.21 - EPS && q.value <= 1.0 + EPS) {
      return { ok: true, fracao: q.value as Fio2Fracao, convertido: false };
    }
    return { ok: false, motivo: "fora_da_faixa" };
  }
  if (q.unit === "%") {
    if (q.value >= 21 - EPS && q.value <= 100 + EPS) {
      return { ok: true, fracao: (q.value / 100) as Fio2Fracao, convertido: true };
    }
    return { ok: false, motivo: "fora_da_faixa" };
  }
  // Unidade ausente ("") JAMAIS é adivinhada — nem fração, nem percentual.
  if (q.unit === "") return { ok: false, motivo: "unidade_ausente" };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

export type ConversaoEscalar =
  | { readonly ok: true; readonly valor: number; readonly convertido: boolean }
  | { readonly ok: false; readonly motivo: "unidade_inmapeavel" };

/** PaO2 para mm[Hg]; kPa converte ×7.50062 (spec SOFA §3.1 linha 2). */
export function paraPaO2MmHg(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mm[Hg]") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "kPa") return { ok: true, valor: q.value * 7.50062, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Bilirrubina total para mg/dL; µmol/L converte ÷17.104 (fator EXATO, OQ-6 (a)). */
export function paraBilirrubinaMgDl(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mg/dL") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "umol/L") return { ok: true, valor: q.value / 17.104, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Creatinina para mg/dL; µmol/L converte ÷88.42 (fator EXATO, OQ-6 (a)). */
export function paraCreatininaMgDl(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "mg/dL") return { ok: true, valor: q.value, convertido: false };
  if (q.unit === "umol/L") return { ok: true, valor: q.value / 88.42, convertido: true };
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Plaquetas: `10*3/uL` e `10*9/L` são numericamente idênticos (spec §3.1 linha 5). */
export function paraPlaquetasContagem(q: QuantidadeComUnidade): ConversaoEscalar {
  if (q.unit === "10*3/uL" || q.unit === "10*9/L") {
    return { ok: true, valor: q.value, convertido: false };
  }
  return { ok: false, motivo: "unidade_inmapeavel" };
}

/** Destino de uma taxa de dose declarada. */
export type LeituraDose =
  | { readonly ok: true; readonly dose: DoseUgKgMin; readonly convertido: boolean }
  | {
      readonly ok: false;
      /**
       * `unidade_reconhecida_nao_normalizavel`: ug/min e mL/h exigem peso +
       * concentração com política VALIDATION REQUIRED — dose-NÃO-usável
       * (caminho do piso por presença), nunca falha de integridade.
       * `unidade_inmapeavel`: unidade fora do conjunto reconhecido —
       * falha de integridade (invalid), HAZ-0032.
       */
      readonly motivo: "unidade_reconhecida_nao_normalizavel" | "unidade_inmapeavel";
    };

/** Lê a taxa de dose declarada. Somente `ug/kg/min` produz dose usável. */
export function doseUgKgMinDe(q: QuantidadeComUnidade): LeituraDose {
  if (!Number.isFinite(q.value)) return { ok: false, motivo: "unidade_inmapeavel" };
  if (q.unit === "ug/kg/min") return { ok: true, dose: q.value as DoseUgKgMin, convertido: false };
  if (q.unit === "ug/min" || q.unit === "mL/h") {
    return { ok: false, motivo: "unidade_reconhecida_nao_normalizavel" };
  }
  return { ok: false, motivo: "unidade_inmapeavel" };
}
