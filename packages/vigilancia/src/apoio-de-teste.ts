/**
 * Utilitários EXCLUSIVOS de teste (excluídos do build — ver `tsconfig.json`).
 * Constroem séries 100% SINTÉTICAS (marcador `SYNTH-`) para exercer os
 * instrumentos de vigilância. Nenhum dado real é usado, gerado ou referenciado
 * aqui, e nenhuma série destas é evidência de comportamento clínico.
 */
import type { AlertaObservado, AvaliacaoObservada, OcupacaoObservada } from "./carga-de-alarmes.js";
import type { ObservacaoObservada } from "./deriva.js";
import type { EpisodioDeUti, OrigemDeAncora } from "./kpir-14.js";
import {
  type AtribuicaoDeVersaoDeRegra,
  instanteAusente,
  instantePresente,
  type ParametrosDeVigilancia,
  POLITICA_DE_PARCIAL_CONSERVADORA,
  parametrosDeInstrumentacao,
} from "./tipos.js";

/** Fuso do sítio assumido em `clinical-kpi-review.md` KPIR-09 (VALIDATION REQUIRED). */
export const FUSO_SINTETICO = "America/Sao_Paulo";

/** Turnos sintéticos de 8 h cobrindo as 24 h exatamente uma vez. */
export const TURNOS_SINTETICOS = [
  { id: "manha", horaInicio: 7, horaFim: 15 },
  { id: "tarde", horaInicio: 15, horaFim: 23 },
  { id: "noite", horaInicio: 23, horaFim: 7 },
] as const;

/** Parâmetros com dia CIVIL local (hora de corte 0). */
export const PARAMETROS_DIA_CIVIL: ParametrosDeVigilancia = parametrosDeInstrumentacao({
  convencaoDeDia: {
    fusoHorario: FUSO_SINTETICO,
    horaDeCorte: 0,
    proveniencia: "convencao-de-dia-nao-ratificada-KPI-OPS-02",
  },
  turnos: [...TURNOS_SINTETICOS],
  politicaDeParcial: POLITICA_DE_PARCIAL_CONSERVADORA,
});

/** Parâmetros com a convenção 7-às-7 (hora de corte 7). */
export const PARAMETROS_SETE_AS_SETE: ParametrosDeVigilancia = parametrosDeInstrumentacao({
  convencaoDeDia: {
    fusoHorario: FUSO_SINTETICO,
    horaDeCorte: 7,
    proveniencia: "convencao-de-dia-nao-ratificada-KPI-OPS-02",
  },
  turnos: [...TURNOS_SINTETICOS],
  politicaDeParcial: POLITICA_DE_PARCIAL_CONSERVADORA,
});

export const REGRA_NEWS2: AtribuicaoDeVersaoDeRegra = {
  tipo: "declarada",
  ruleId: "RULE-NEWS2",
  ruleVersion: "0.2.0",
};

export function regra(
  ruleVersion: string,
  impressaoDeConteudo?: string,
): AtribuicaoDeVersaoDeRegra {
  return {
    tipo: "declarada",
    ruleId: "RULE-NEWS2",
    ruleVersion,
    ...(impressaoDeConteudo === undefined ? {} : { impressaoDeConteudo }),
  };
}

/** Instante UTC a partir de uma data local `YYYY-MM-DD` e hora local em -03:00. */
export function utcLocal(data: string, horaLocal: number, minuto = 0): string {
  const base = Date.parse(`${data}T00:00:00-03:00`);
  return new Date(base + horaLocal * 3_600_000 + minuto * 60_000).toISOString();
}

export function ocupacaoSintetica(entrada: {
  readonly encontroId: string;
  readonly unidadeId?: string | null;
  readonly admissaoUtc: string;
  readonly altaUtc?: string;
}): OcupacaoObservada {
  return {
    encontroId: entrada.encontroId,
    unidadeId: entrada.unidadeId === undefined ? "SYNTH-UTI-01" : entrada.unidadeId,
    admissao: instantePresente(entrada.admissaoUtc),
    fim:
      entrada.altaUtc === undefined ? { tipo: "em_curso" } : { tipo: "alta", utc: entrada.altaUtc },
  };
}

export function avaliacaoSintetica(entrada: {
  readonly id: string;
  readonly encontroId: string;
  readonly utc: string;
  readonly estadoBruto?: string;
  readonly regra?: AtribuicaoDeVersaoDeRegra;
}): AvaliacaoObservada {
  return {
    avaliacaoId: entrada.id,
    encontroId: entrada.encontroId,
    instante: instantePresente(entrada.utc),
    estadoBruto: entrada.estadoBruto ?? "valido",
    regra: entrada.regra ?? REGRA_NEWS2,
  };
}

export function alertaSintetico(entrada: {
  readonly id: string;
  readonly encontroId: string;
  readonly utc?: string;
  readonly motivoDeAusencia?: string;
  readonly unidadeId?: string | null;
  readonly severidade?: string;
  readonly regra?: AtribuicaoDeVersaoDeRegra;
}): AlertaObservado {
  return {
    alertaId: entrada.id,
    encontroId: entrada.encontroId,
    unidadeId: entrada.unidadeId === undefined ? "SYNTH-UTI-01" : entrada.unidadeId,
    instante:
      entrada.utc === undefined
        ? instanteAusente(entrada.motivoDeAusencia ?? "instante-nao-informado")
        : instantePresente(entrada.utc),
    severidade: entrada.severidade ?? "alerta",
    regra: entrada.regra ?? { tipo: "ausente", motivo: "sem-atribuicao-no-esquema" },
  };
}

export function observacaoSintetica(entrada: {
  readonly id: string;
  readonly conceito: string;
  readonly utc: string;
  readonly qualidade?: string;
  readonly unidadeCanonica?: string | null;
  readonly semTempoClinico?: boolean;
}): ObservacaoObservada {
  return {
    observacaoId: entrada.id,
    encontroId: "SYNTH-ENC-01",
    conceito: entrada.conceito,
    qualidade: entrada.qualidade ?? "valid",
    unidadeCanonica: entrada.unidadeCanonica === undefined ? "/min" : entrada.unidadeCanonica,
    tempoClinico:
      entrada.semTempoClinico === true
        ? instanteAusente("fonte-nao-enviou-tempo-clinico")
        : instantePresente(entrada.utc),
    instanteDeJanela: instantePresente(entrada.utc),
  };
}

export function episodioSintetico(entrada: {
  readonly id: string;
  readonly pacienteRef?: string;
  readonly unidadeId?: string | null;
  readonly admissaoUtc?: string | null;
  readonly altaUtc?: string;
  readonly origem?: OrigemDeAncora;
  readonly disposicao?: EpisodioDeUti["disposicao"];
}): EpisodioDeUti {
  return {
    episodioId: entrada.id,
    pacienteRef: entrada.pacienteRef ?? `amh:psr:v1:SYNTH-${entrada.id}`,
    unidadeId: entrada.unidadeId === undefined ? "SYNTH-UTI-01" : entrada.unidadeId,
    admissaoUtc: entrada.admissaoUtc === undefined ? null : entrada.admissaoUtc,
    ancoraDeAlta:
      entrada.altaUtc === undefined
        ? { tipo: "ausente", motivo: "sem-alta-registrada" }
        : {
            tipo: "presente",
            utc: entrada.altaUtc,
            origem: entrada.origem ?? "registro-clinico-documentado",
          },
    disposicao: entrada.disposicao ?? { tipo: "vivo" },
  };
}
