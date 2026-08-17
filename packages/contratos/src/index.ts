/**
 * @intensicare/contratos
 *
 * Contratos de API do IntensiCare V2 — contract-first, OpenAPI 3.1, erros
 * `application/problem+json` (RFC 9457) em pt-BR e idempotência por
 * `Idempotency-Key`.
 *
 * SPR-G7-2: primeira fatia de contrato real (ingestão de observações,
 * projeção de grade de leitos, explicação de avaliação por paciente,
 * reconhecimento de alerta com concorrência otimista, healthz). A minuta
 * legível por humanos e por gerador está em `../openapi.yaml`; estes tipos
 * são escritos à mão para serem coerentes com aquele documento — nenhum
 * gerador automático os produziu nesta fatia (registrado como pendência).
 *
 * Integração da fatia (INTEGRADOR SPR-G7-2): a avaliação por trás deste
 * contrato agora é o avaliador NEWS2 REAL de `@intensicare/kernel-clinico`
 * (RULE-NEWS2 0.2.0) — os sete parâmetros do NEWS2 entram pela ingestão
 * (incluindo `FluxoO2` para derivar o estado ar/oxigênio e
 * `NivelConsciencia` como token ACVPU codificado) e o status de avaliação
 * espelha os cinco estados da ADR-0008. `parcial` permanece no enum por
 * ser RESERVADO a classes futuras de escore (ADR-0026, classes 2+), mas é
 * INALCANÇÁVEL para NEWS2 (decisão N-8/GDEC-0007: all-or-not_evaluated é
 * permanente) — a API integrada jamais o produz para NEWS2.
 *
 * Este pacote NÃO tem dependência de runtime (ver
 * `docs/06-architecture/premissas-de-construcao.md` PRE-11 e o mesmo padrão
 * de `packages/kernel-clinico`): apenas tipos e constantes TypeScript, sem
 * I/O, sem validação (a validação zod concreta vive em `apps/api`).
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este pacote.
 */

export const packageVersion = "0.0.0" as const;

// ---------------------------------------------------------------------------
// Convenções transversais (erro, idempotência, concorrência)
// ---------------------------------------------------------------------------

/** Nome do cabeçalho HTTP usado para idempotência de escrita. */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key" as const;

/**
 * Nome do cabeçalho de resposta que sinaliza, de forma explícita e nunca
 * silenciosa, que a resposta de uma escrita idempotente foi servida a
 * partir do resultado original de uma chamada anterior com a mesma
 * `Idempotency-Key` — nenhuma duplicata de efeito ocorreu.
 */
export const IDEMPOTENCY_REPLAYED_HEADER = "Idempotency-Replayed" as const;

/**
 * Nome do cabeçalho HTTP usado para concorrência otimista (ADR-0009 W3,
 * Q2-A aceita): o chamador envia a versão do recurso que viu; divergência
 * falha explicitamente com o estado corrente — jamais última-escrita-vence
 * silenciosa.
 */
export const IF_MATCH_HEADER = "If-Match" as const;

/** Tipo MIME das respostas de erro do contrato de API. */
export const PROBLEM_JSON_MIME_TYPE = "application/problem+json" as const;

/**
 * Envelope de erro RFC 9457 (`application/problem+json`), com os campos
 * textuais (`title`, `detail`) em pt-BR.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

/**
 * Envelope de erro de conflito de concorrência (HTTP 412), extensão do RFC
 * 9457 com o estado corrente do recurso — para que o ator humano redecida
 * com contexto (ADR-0009 W3), sem precisar de uma segunda requisição.
 */
export interface ProblemDetailsConflitoVersao extends ProblemDetails {
  versaoAtual: number;
  estadoAtual: EstadoItemTrabalho;
}

// ---------------------------------------------------------------------------
// Ingestão de observações (POST /v1/ingestao/observacoes)
// ---------------------------------------------------------------------------

/**
 * Parâmetros clínicos aceitos nesta fatia — os sete parâmetros pontuados
 * do NEWS2 (RULE-NEWS2 0.2.0), no vocabulário pt-BR do contrato:
 * `FR` (frequência respiratória), `SpO2`, `FluxoO2` (fluxo de O2 inalado
 * em L/min — deriva o estado ar/oxigênio conforme spec §2.1 linha 3),
 * `PAS`, `FC`, `NivelConsciencia` (token ACVPU codificado) e
 * `Temperatura`. Não é o catálogo final de parâmetros clínicos (esse
 * catálogo é conteúdo versionado de bundle, fora do escopo desta fatia).
 */
export type ParametroClinico =
  | "FC"
  | "FR"
  | "PAS"
  | "SpO2"
  | "FluxoO2"
  | "Temperatura"
  | "NivelConsciencia";

/**
 * Uma observação de entrada, antes de validação. Duas formas:
 * - numérica (`valor` + `unidade`) — todos os parâmetros exceto
 *   `NivelConsciencia`;
 * - codificada (`codigo`) — `NivelConsciencia` (token ACVPU: A/C/V/P/U).
 * A validação concreta (obrigatoriedade por parâmetro) vive em `apps/api`;
 * observação fora dessas formas vai a quarentena — nunca coagida.
 */
export interface ObservacaoEntrada {
  parametro: ParametroClinico;
  valor?: number;
  unidade?: string;
  /** Token codificado (ex.: ACVPU "A") — exigido para `NivelConsciencia`. */
  codigo?: string;
  /** Instante CLÍNICO da coleta, ISO 8601 com fuso (ex.: `2026-08-16T12:00:00Z`). */
  coletadoEm: string;
}

/**
 * Uma observação de entrada que falhou validação e foi colocada em
 * quarentena — nunca descartada silenciosamente (regra dura de dado
 * sintético/observação inválida do prompt §12.1: "unknown codes or units
 * must be quarantined or explicitly represented — not silently coerced").
 */
export interface ObservacaoEmQuarentena {
  /** A entrada original tal como recebida (não normalizada). */
  entrada: unknown;
  /** Motivo da rejeição, em pt-BR, sem PHI. */
  motivo: string;
}

/**
 * Contexto demográfico mínimo para o gate populacional fail-closed do
 * kernel clínico (ADR-0027 A27-1: >=18 produto-wide; idade desconhecida
 * NUNCA presume adulto; N-2: gravidez documentada fica fora de população).
 * PREMISSA (reversível, GDEC-0015/0017): nesta fatia o contexto viaja no
 * envelope de ingestão — demografia persistida por paciente é matéria de
 * fatia futura; ausência do contexto ⇒ idade desconhecida ⇒ avaliação
 * `indisponivel` com razão explícita (fail-closed, jamais "adulto por
 * omissão").
 */
export interface ContextoAvaliacaoPaciente {
  /** Idade VERIFICADA em anos; omitida/null = idade desconhecida (fail-closed). */
  idadeAnos?: number | null;
  /** `true` somente com gravidez documentada; omitido = não documentada (anotação N-2). */
  gravidezDocumentada?: boolean;
}

export interface IngestaoObservacoesRequisicao {
  encontroId: string;
  leitoId: string;
  /** Referência de paciente sintética (`SYNTH-` — política de dados sintéticos). */
  pacienteRef: string;
  observacoes: ObservacaoEntrada[];
  /** Contexto do gate populacional — ver `ContextoAvaliacaoPaciente`. */
  contexto?: ContextoAvaliacaoPaciente;
}

export interface IngestaoObservacoesResposta {
  encontroId: string;
  /** Instante em que o servidor recebeu e processou o envelope, ISO 8601. */
  recebidoEm: string;
  aceitas: ObservacaoEntrada[];
  quarentena: ObservacaoEmQuarentena[];
  avaliacao: ResultadoAvaliacao;
  /** Alerta gerado por esta ingestão, se algum — nunca implícito. */
  alerta: ResumoItemTrabalho | null;
}

// ---------------------------------------------------------------------------
// Avaliação (status explícito — nunca escore/banda "normal" por omissão)
// ---------------------------------------------------------------------------

/**
 * Status explícito da avaliação — espelho pt-BR dos cinco estados da
 * ADR-0008 (kernel clínico real, RULE-NEWS2 0.2.0):
 * `valido` ↔ `valid`; `parcial` ↔ `partial`; `indisponivel` ↔
 * `not_evaluated`; `desatualizado` ↔ `stale`; `invalido` ↔ `invalid`.
 *
 * `parcial` é RESERVADO a classes futuras de escore (ADR-0026, classes
 * 2+) e é INALCANÇÁVEL para NEWS2 (decisão N-8/GDEC-0007: para NEWS2,
 * all-or-not_evaluated é permanente) — a API integrada jamais o produz
 * para NEWS2; permanece no enum apenas para não quebrar o contrato quando
 * uma classe 2+ existir. Insumo ausente NUNCA produz `escore`/`banda` —
 * ver `ResultadoAvaliacao.escore`/`banda` (sempre `null` fora de
 * `valido`). Ausência de escore jamais significa normalidade (HAZ-0005).
 */
export type StatusAvaliacao = "valido" | "parcial" | "indisponivel" | "desatualizado" | "invalido";

/**
 * Banda de risco consultiva — espelho pt-BR dos tiers do NEWS2 (RCP 2017
 * Chart 2, spec §4.2): `normal` ↔ `low`; `atencao` ↔ `low_medium`
 * (parâmetro vermelho isolado); `alerta` ↔ `medium`; `critico` ↔ `high`.
 * Semântica CONSULTIVA de exibição — nunca auto-escalonamento.
 */
export type BandaRisco = "normal" | "atencao" | "alerta" | "critico";

/** Explicação da contribuição de um único parâmetro à avaliação (kernel real). */
export interface ContribuicaoParametro {
  parametro: ParametroClinico;
  /** `true` quando um valor da fonte foi efetivamente usado na banda. */
  presente: boolean;
  valor?: number;
  unidade?: string;
  /** Token codificado usado (ex.: ACVPU "A"), quando o valor não é numérico. */
  codigo?: string;
  /** Pontos contribuídos por este parâmetro (só quando pontuável). */
  pontos?: number;
  /** Status do parâmetro no vocabulário do kernel (ex.: `missing`, `stale`, `invalid`). */
  statusParametro?: string;
  /** Razão legível por máquina quando o parâmetro não pontua (spec §5.2). */
  motivo?: string | null;
  /** Instante clínico do insumo usado, quando houver. */
  coletadoEm?: string | null;
  /** Explicação pt-BR da contribuição (ou da razão de não contribuir). */
  explicacao?: string;
}

export interface ResultadoAvaliacao {
  status: StatusAvaliacao;
  /** Parâmetros exigidos que NÃO estavam disponíveis nesta avaliação. */
  parametrosAusentes: ParametroClinico[];
  parametros: ContribuicaoParametro[];
  /** `null` sempre que `status !== "valido"` — nunca um número "normal" por omissão. */
  escore: number | null;
  /** `null` sempre que `status !== "valido"`. */
  banda: BandaRisco | null;
  avaliadoEm: string;
  /** Razões legíveis por máquina (vocabulário da spec §5.2/ADR-0008 N3). */
  motivos: string[];
  /** Anotações obrigatórias visíveis (N-2/N-3/N-4/N-6), em pt-BR. */
  anotacoes: string[];
  /** Explicação agregada em pt-BR (spec §7) — sempre presente. */
  explicacao: string;
  /** Parâmetro vermelho (pontuação 3 isolada) entre insumos válidos (INV-B). */
  parametroVermelho: boolean;
  /** Identificação da regra usada (rastreabilidade), ex.: `RULE-NEWS2@0.2.0`. */
  versaoRegra: string;
}

// ---------------------------------------------------------------------------
// Item de trabalho / alerta (ADR-0009 — Q1-A única máquina + Q2-A otimista)
// ---------------------------------------------------------------------------

/**
 * Estados nucleares do `WorkItem` (ADR-0009 W1, minuta aceita GDEC-0008).
 * Entrega/notificação é dimensão paralela — nunca estado deste ciclo de
 * vida (DIV-1).
 */
export type EstadoItemTrabalho =
  | "nao-atribuido"
  | "atribuido"
  | "reconhecido"
  | "escalado"
  | "sobreposto"
  | "resolvido"
  | "suprimido"
  | "reaberto";

export interface ResumoItemTrabalho {
  id: string;
  estado: EstadoItemTrabalho;
  /** Versão do recurso, para concorrência otimista (ADR-0009 W3). */
  versao: number;
}

export interface ItemTrabalho extends ResumoItemTrabalho {
  tenantId: string;
  encontroId: string;
  leitoId: string;
  pacienteRef: string;
  escore: number;
  banda: BandaRisco;
  motivo: string;
  criadoEm: string;
  atualizadoEm: string;
  reconhecidoPor?: string;
  reconhecidoEm?: string;
}

export interface ReconhecerAlertaRequisicao {
  comentario?: string;
}

export interface ReconhecerAlertaResposta {
  item: ItemTrabalho;
}

// ---------------------------------------------------------------------------
// Projeção de leitura — grade de leitos (ADR-0011 P1/P2/P6/P7)
// ---------------------------------------------------------------------------

/**
 * Estado de frescor do dado exibido (ADR-0011 P6). Limiares concretos são
 * ilustrativos nesta fatia — `VALIDATION REQUIRED` no ADR-0011 §3 D-alvos;
 * ver `apps/api/src/store.ts`.
 */
export type Frescor = "atual" | "envelhecendo" | "desatualizado";

export interface EntradaGradeLeitos {
  leitoId: string;
  encontroId: string | null;
  pacienteRef: string | null;
  /** `null` sempre que `statusAvaliacao !== "valido"` (ou nenhuma avaliação ainda existe). */
  escore: number | null;
  banda: BandaRisco | null;
  statusAvaliacao: StatusAvaliacao | null;
  frescor: Frescor;
  atualizadoEm: string | null;
  alerta: ResumoItemTrabalho | null;
}

export interface GradeLeitosResposta {
  leitos: EntradaGradeLeitos[];
}

// ---------------------------------------------------------------------------
// Avaliações por paciente (GET /v1/pacientes/{id}/avaliacoes)
// ---------------------------------------------------------------------------

export interface AvaliacoesPacienteResposta {
  pacienteRef: string;
  /** Mais recente primeiro. */
  avaliacoes: ResultadoAvaliacao[];
}

// ---------------------------------------------------------------------------
// Fluxo de eventos (GET /v1/eventos/stream) — ver pendências no README
// ---------------------------------------------------------------------------

/**
 * Um evento durável do backbone interno, tal como exposto (parcialmente —
 * ver pendências) pelo fluxo de eventos. `sequencia` é o cursor de
 * retomada (ADR-0011 P4), monotônico por tenant.
 */
export interface EventoFluxo {
  sequencia: number;
  /**
   * `observacao-clinica-registrada` é o evento por fato clínico gravado
   * pelo outbox transacional (`clinical_observation_recorded` no backbone
   * interno) — surge no replay desde a integração real da fatia.
   */
  tipo:
    | "observacoes-ingeridas"
    | "observacao-clinica-registrada"
    | "avaliacao-computada"
    | "alerta-criado"
    | "alerta-atualizado";
  tenantId: string;
  ocorridoEm: string;
  dados: unknown;
}

// ---------------------------------------------------------------------------
// Saúde do serviço
// ---------------------------------------------------------------------------

export interface HealthzResposta {
  status: "ok";
}
