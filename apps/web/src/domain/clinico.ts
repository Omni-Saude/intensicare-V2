/**
 * apps/web/src/domain/clinico.ts
 *
 * Tipos de domínio clínico usados por esta fatia (grade de leitos,
 * avaliação do paciente com explicação por parâmetro, alertas). Estes
 * tipos são o MODELO DE APRESENTAÇÃO da UI — não o contrato de rede.
 *
 * Integração SPR-G7-2: o contrato real (`@intensicare/contratos`) é
 * dependência declarada deste app; a tradução contrato→UI vive
 * exclusivamente em `../api/clienteHttp.ts` (funções `mapear*`, puras e
 * testadas) — estes tipos NÃO são fonte paralela de verdade do contrato,
 * são a linguagem interna das telas (ADR-0021 F1).
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este arquivo ou pelos que o consomem.
 */
import type { BandaRisco, EstadoAvaliacao, EstadoFrescor, EstadoItemTrabalho } from "./estados.js";

/**
 * Sete parâmetros do NEWS2 (Royal College of Physicians — descrição
 * pública do escore). Reproduzidos aqui apenas para fins ILUSTRATIVOS
 * desta fatia sintética; nenhuma validação clínica desta implementação é
 * afirmada — ver `./news2.ts` para a tabela de pontos e seu aviso.
 */
export type ParametroId =
  | "frequencia_respiratoria"
  | "saturacao_oxigenio"
  | "uso_oxigenio_suplementar"
  | "temperatura"
  | "pressao_arterial_sistolica"
  | "frequencia_cardiaca"
  | "nivel_consciencia";

/** Contribuição de um único parâmetro para o escore, com explicação pt-BR. */
export interface ContribuicaoParametro {
  parametro: ParametroId;
  /** Rótulo clínico pt-BR do parâmetro (para exibição). */
  rotulo: string;
  /** Valor observado — `null` quando o insumo está ausente (nunca 0/omitido silenciosamente). */
  valorObservado: number | string | null;
  unidade?: string;
  /** Pontos atribuídos — `null` quando não computável (insumo ausente/inválido). */
  pontos: number | null;
  frescor: EstadoFrescor;
  /** Horário (ISO 8601) da leitura de origem — `null` se nunca recebida. */
  horarioFonte: string | null;
  /** Explicação clínica pt-BR: por que este ponto foi (ou não foi) atribuído. */
  explicacao: string;
}

/** Avaliação NEWS2 (ilustrativa/sintética) de um paciente em um leito. */
export interface AvaliacaoPaciente {
  estadoAvaliacao: EstadoAvaliacao;
  /** Escore total — `null` quando `estadoAvaliacao` é fail-closed (`nao_avaliada`/`invalida`). */
  news2Total: number | null;
  /** Banda de risco — `null` sob o mesmo fail-closed acima; nunca "baixo" por omissão (HAZ-0005). */
  bandaRisco: BandaRisco | null;
  contribuicoes: ContribuicaoParametro[];
  /** Insumos ausentes DECLARADOS (nunca silenciosamente tratados como normais). */
  insumosAusentes: ParametroId[];
  /** Insumos presentes, mas envelhecidos/desatualizados, DECLARADOS. */
  insumosVelhos: ParametroId[];
  /**
   * Razões legíveis por máquina, originadas no backend (ADR-0008 N3 —
   * `missing_required_input:<insumo>` e similares). O frontend EXIBE estas
   * razões; jamais redige um substituto genérico no lugar delas (ADR-0021 F3).
   */
  motivos: string[];
  /**
   * Anotações obrigatórias visíveis (N-2/N-3/N-4/N-6), em pt-BR, vindas do
   * backend. O contrato as declara obrigatórias na UI — omiti-las é defeito,
   * não simplificação.
   */
  anotacoes: string[];
  /** Explicação agregada pt-BR do backend (spec §7) — o racional de ADR-0021 F8. */
  explicacao: string;
  /**
   * Um parâmetro isolado pontuou o máximo (INV-B, ADR-0026). Sobrevive ao
   * total não computável: IA-N4 exige exibir as duas informações "sem que uma
   * esconda a outra".
   */
  parametroVermelho: boolean;
  /** Horário (ISO 8601) em que o cálculo foi realizado — `null` se nunca calculado. */
  calculadoEm: string | null;
  /**
   * Versão da regra usada (rastreabilidade — ADR-0021 F8). `null` quando a
   * superfície consultada NÃO publica o campo: a projeção da grade não o
   * publica, e afirmar uma versão que não veio do backend é inventar
   * rastreabilidade.
   */
  versaoRegra: string | null;
}

/**
 * Rótulo de exibição de um paciente a partir da referência pseudonimizada
 * (`amh:psr:v1:<id>`). Exibe apenas o sufixo — o mínimo que identifica o
 * sujeito na tela sem trafegar a referência inteira em cada superfície
 * (QAS-0028). Nunca é um nome: esta fatia opera exclusivamente sobre dados
 * sintéticos `SYNTH-`.
 */
export function apelidoDePaciente(pacienteRef: string): string {
  const sufixo = pacienteRef.split(":").at(-1) ?? pacienteRef;
  return `Paciente ${sufixo}`;
}

/** Um item da grade de leitos da UTI. */
export interface ItemGradeLeito {
  leitoId: string;
  /** `null` quando o leito está vago (sem paciente sintético associado). */
  pacienteRef: string | null;
  /** Apelido de exibição sintético (nunca um nome real) — `null` se vago. */
  pacienteApelido: string | null;
  avaliacao: AvaliacaoPaciente | null;
  /** Alertas (ativos ou históricos recentes) associados a este leito. */
  alertas: Alerta[];
}

/**
 * Ordem de severidade de frescor usada por `calcularFrescorGeral` —
 * quanto maior o índice, pior o frescor. `ausente`/`invalido` não
 * entram aqui porque, nesta fatia, insumo ausente já é representado à
 * parte (`insumosAusentes`), não como "o pior frescor entre os
 * presentes".
 */
const ORDEM_SEVERIDADE_FRESCOR: EstadoFrescor[] = [
  "atual",
  "corrigido",
  "substituido",
  "conflitante",
  "envelhecendo",
  "desatualizado",
  "expirado",
];

/**
 * Frescor geral de uma avaliação = o pior frescor entre as contribuições
 * com valor presente (nunca inventa um frescor melhor que o pior insumo
 * real usado no cálculo). `atual` se não houver nenhuma contribuição com
 * valor observado.
 */
export function calcularFrescorGeral(contribuicoes: ContribuicaoParametro[]): EstadoFrescor {
  let pior: EstadoFrescor = "atual";
  let indicePior = 0;
  for (const contribuicao of contribuicoes) {
    if (contribuicao.valorObservado === null) continue;
    const indice = ORDEM_SEVERIDADE_FRESCOR.indexOf(contribuicao.frescor);
    if (indice > indicePior) {
      indicePior = indice;
      pior = contribuicao.frescor;
    }
  }
  return pior;
}

/** Um alerta (item de trabalho) associado a um leito/paciente. */
export interface Alerta {
  alertaId: string;
  leitoId: string;
  pacienteRef: string;
  /**
   * Severidade ORIGINADA NO BACKEND. `null` quando o backend não atribuiu
   * banda — o que acontece sempre que a avaliação não é `valida`. Nunca
   * preenchida por omissão: ADR-0011 P7 é explícita em que "nenhuma projeção,
   * gateway ou cliente promove status", e um item sem avaliação computável
   * jamais pode ficar indistinguível de um item genuinamente grave
   * (ADR-0008 N7; QAS-0017).
   */
  severidade: BandaRisco | null;
  descricao: string;
  criadoEm: string;
  estado: EstadoItemTrabalho;
  /**
   * Versão do recurso para concorrência otimista (If-Match — ADR-0009 W3).
   * OBRIGATÓRIA: é a "versão vista" pelo ator humano, e é ela que o comando
   * de reconhecimento carrega. Torná-la opcional convidava o chamador a
   * omiti-la e o cliente a fabricar um valor — que foi exatamente o defeito
   * corrigido aqui.
   */
  versao: number;
  reconhecidoPor?: string;
  reconhecidoEm?: string;
}
