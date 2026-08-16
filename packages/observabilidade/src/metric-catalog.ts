/**
 * packages/observabilidade/src/metric-catalog.ts — catálogo versionado de
 * instrumentos de telemetria.
 *
 * SOURCE (ADR-0020 O2): "As medições do §15.3 são implementadas como métricas
 * nomeadas desde a fatia G7". SOURCE (ADR-0020 §5, consequência estrutural):
 * "a taxonomia de métricas vira contrato interno versionado". SOURCE
 * (ADR-0020 O8): "alerta de operação ≠ alerta clínico; nomenclatura distinta
 * obrigatória".
 *
 * Por que um catálogo fechado
 * ----------------------------
 * O nome da métrica é o tipo: `MetricName` é `keyof typeof METRIC_CATALOG`, e
 * o `Meter` só aceita nomes catalogados com o instrumento do tipo certo. Uma
 * métrica improvisada no ponto de emissão não compila — o que fecha, de uma
 * vez, o caminho mais comum de vazamento (alguém inventa
 * `alerta.paciente.12345` como nome de série) e a métrica órfã que o gatilho
 * T5 do ADR-0020 manda podar.
 *
 * **Nenhuma meta numérica aparece aqui.** Todo alvo é VALIDATION REQUIRED até
 * o Gate G1 (ADR-0020 O2/D2). Este catálogo diz O QUE medir e com que
 * unidade; QUANTO é matéria do G1 e do titular.
 */

/**
 * As 12 dimensões de operabilidade do prompt §15.3.
 *
 * INFERENCE (do prompt §15.3, linhas 1121-1135): o §15.3 enumera dez itens de
 * SLO em lista e fecha com dois requisitos em prosa — prontidão como
 * capacidade segura (D11) e exposição de degradação/procedimentos de downtime
 * sem vazar PHI (D12). A decomposição em doze é desta materialização, não uma
 * numeração do prompt; ela existe para que a tabela de estado real em
 * docs/13-operations-and-reliability/ possa ser conferida item a item.
 */
export const OPERABILITY_DIMENSIONS = {
  D01: "Latência e perda fonte→aceito",
  D02: "Latência aceito→avaliação",
  D03: "Latência avaliação→item de trabalho durável",
  D04: "Latência gerado→visível e gerado→reconhecido",
  D05: "Prevalência de obsoleto/ausente/inválido/conflito",
  D06: "Lag de fila, backlog de replay, lag de projeção e divergência de reconciliação",
  D07: "Saúde de rule bundle: versão e carga",
  D08: "Disponibilidade de conector e drift de contrato",
  D09: "Negativas de política cross-tenant e acesso suspeito",
  D10: "Backup, integridade de restore, RPO/RTO e integridade de exportação de evidência",
  D11: "Prontidão como capacidade segura (não liveness de processo)",
  D12: "Degradação exposta sem vazar PHI, downtime, fallback manual e reconciliação",
} as const;

export type OperabilityDimensionId = keyof typeof OPERABILITY_DIMENSIONS;

/** Tipos de instrumento do modelo de dados OpenTelemetry usados nesta fatia. */
export type InstrumentKind = "counter" | "up_down_counter" | "histogram";

export interface InstrumentSpec {
  readonly kind: InstrumentKind;
  /** Unidade no estilo OTel/UCUM: "ms", "1", "{item}". */
  readonly unit: string;
  /** Descrição em pt-BR (o catálogo é documentação normativa, não só código). */
  readonly description: string;
  readonly dimension: OperabilityDimensionId;
  /** Cenários de atributo de qualidade que esta métrica serve (docs/06-architecture/quality-attributes). */
  readonly qas: readonly string[];
  /** Chaves de atributo previstas — conferidas por teste contra o que é emitido. */
  readonly attributeKeys: readonly string[];
  /** Alvo numérico. Sempre `null` nesta fase: VALIDATION REQUIRED até o Gate G1. */
  readonly target: null;
}

/**
 * Catálogo. Prefixos:
 *   `intensicare.clinical.*`  — laço clínico (avaliação, alerta, item de trabalho);
 *   `intensicare.backbone.*`  — outbox/eventos/projeções (ADR-0010/0011);
 *   `intensicare.ops.*`       — sinal OPERACIONAL (jamais chamado "alerta": ADR-0020 O8);
 *   `intensicare.probe.*`     — sondas sintéticas ponta a ponta (§9.4).
 */
export const METRIC_CATALOG = {
  "intensicare.clinical.evaluation.duration": {
    kind: "histogram",
    unit: "ms",
    description:
      "Latência de uma avaliação clínica determinística, da entrada dos insumos ao registro de avaliação.",
    dimension: "D02",
    qas: ["QAS-0003"],
    attributeKeys: ["rule", "status"],
    target: null,
  },
  "intensicare.clinical.evaluation.total": {
    kind: "counter",
    unit: "{avaliacao}",
    description: "Avaliações concluídas, particionadas pelos cinco estados da ADR-0008.",
    dimension: "D05",
    qas: ["QAS-0007"],
    attributeKeys: ["rule", "status"],
    target: null,
  },
  "intensicare.clinical.evaluation.missing_input.total": {
    kind: "counter",
    unit: "{insumo}",
    description:
      "Insumos ausentes por parâmetro. Numerador da taxa de insumo ausente; o denominador é intensicare.clinical.evaluation.total.",
    dimension: "D05",
    qas: ["QAS-0007"],
    attributeKeys: ["rule", "parameter"],
    target: null,
  },
  "intensicare.clinical.pipeline.latency": {
    kind: "histogram",
    unit: "ms",
    description:
      "Latência por etapa do laço mínimo de segurança (fonte→aceito, aceito→avaliação, avaliação→item durável, gerado→visível, gerado→reconhecido).",
    dimension: "D01",
    qas: ["QAS-0001", "QAS-0003", "QAS-0004", "QAS-0005", "QAS-0006"],
    attributeKeys: ["stage"],
    target: null,
  },
  "intensicare.clinical.pipeline.loss.total": {
    kind: "counter",
    unit: "{item}",
    description: "Itens perdidos por etapa do laço (fonte→aceito e adiante) — perda do §15.3 b1.",
    dimension: "D01",
    qas: ["QAS-0002"],
    attributeKeys: ["stage", "category"],
    target: null,
  },
  "intensicare.clinical.work_item.current": {
    kind: "up_down_counter",
    unit: "{item}",
    description:
      "Contagem corrente de itens de trabalho por estado da máquina da ADR-0009 (os oito estados vêm de @intensicare/dominio).",
    dimension: "D04",
    qas: ["QAS-0005", "QAS-0006"],
    attributeKeys: ["state"],
    target: null,
  },
  "intensicare.clinical.work_item.transition.total": {
    kind: "counter",
    unit: "{transicao}",
    description: "Transições de estado de item de trabalho, por estado de origem e destino.",
    dimension: "D04",
    qas: ["QAS-0006"],
    attributeKeys: ["from", "to"],
    target: null,
  },
  "intensicare.backbone.outbox.depth": {
    kind: "up_down_counter",
    unit: "{evento}",
    description:
      "Profundidade do outbox transacional (ADR-0010) — eventos gravados e ainda não publicados.",
    dimension: "D06",
    qas: ["QAS-0008"],
    attributeKeys: ["scope.ref"],
    target: null,
  },
  "intensicare.backbone.replay.backlog": {
    kind: "up_down_counter",
    unit: "{evento}",
    description: "Backlog de replay pendente (ADR-0010 B4).",
    dimension: "D06",
    qas: ["QAS-0008"],
    attributeKeys: [],
    target: null,
  },
  "intensicare.backbone.projection.lag": {
    kind: "histogram",
    unit: "ms",
    description: "Atraso de projeção de leitura em relação ao fato durável (ADR-0011 P5).",
    dimension: "D06",
    qas: ["QAS-0009"],
    attributeKeys: ["projection"],
    target: null,
  },
  "intensicare.backbone.reconciliation.divergence.total": {
    kind: "counter",
    unit: "{divergencia}",
    description: "Divergências detectadas na reconciliação entre lanes (ADR-0006).",
    dimension: "D06",
    qas: ["QAS-0010"],
    attributeKeys: ["projection"],
    target: null,
  },
  "intensicare.clinical.rule_bundle.availability": {
    kind: "up_down_counter",
    unit: "{bundle}",
    description:
      "Disponibilidade do bundle de regra por estado (active/killed/rolled_back/load_failed) — ADR-0007.",
    dimension: "D07",
    qas: ["QAS-0011"],
    attributeKeys: ["rule", "availability"],
    target: null,
  },
  "intensicare.ops.connector.unavailable.total": {
    kind: "counter",
    unit: "{ocorrencia}",
    description: "Indisponibilidade de conector externo, por conector (referência opaca).",
    dimension: "D08",
    qas: ["QAS-0012"],
    attributeKeys: ["connector.ref"],
    target: null,
  },
  "intensicare.ops.contract_drift.total": {
    kind: "counter",
    unit: "{ocorrencia}",
    description: "Drift de contrato detectado em conector externo.",
    dimension: "D08",
    qas: ["QAS-0013"],
    attributeKeys: ["connector.ref"],
    target: null,
  },
  "intensicare.ops.policy_denial.total": {
    kind: "counter",
    unit: "{negativa}",
    description: "Negativas de política de acesso, incluindo tentativa cross-tenant.",
    dimension: "D09",
    qas: ["QAS-0014"],
    attributeKeys: ["kind", "tenant.ref"],
    target: null,
  },
  "intensicare.ops.failure.total": {
    kind: "counter",
    unit: "{falha}",
    description:
      "Falhas por categoria fechada. SINAL OPERACIONAL — nunca chamado de alerta (ADR-0020 O8).",
    dimension: "D05",
    qas: ["QAS-0007"],
    attributeKeys: ["category"],
    target: null,
  },
  "intensicare.ops.backup.result.total": {
    kind: "counter",
    unit: "{execucao}",
    description: "Resultado de execução de backup (sucesso/falha) — sem meta de RPO/RTO aqui.",
    dimension: "D10",
    qas: ["QAS-0015"],
    attributeKeys: ["outcome"],
    target: null,
  },
  "intensicare.ops.restore.integrity.total": {
    kind: "counter",
    unit: "{ensaio}",
    description:
      "Ensaios de restore por desfecho de integridade. Restore não ensaiado não conta como backup (ADR-0020 O6).",
    dimension: "D10",
    qas: ["QAS-0015"],
    attributeKeys: ["outcome"],
    target: null,
  },
  "intensicare.ops.evidence_export.integrity.total": {
    kind: "counter",
    unit: "{exportacao}",
    description: "Verificações de integridade de exportação de evidência (ADR-0020 O9).",
    dimension: "D10",
    qas: ["QAS-0016"],
    attributeKeys: ["outcome"],
    target: null,
  },
  "intensicare.ops.readiness.verdict.total": {
    kind: "counter",
    unit: "{avaliacao}",
    description:
      "Vereditos de prontidão emitidos (ready/degraded/not_ready) — prontidão é capacidade segura, não liveness.",
    dimension: "D11",
    qas: ["QAS-0029"],
    attributeKeys: ["verdict"],
    target: null,
  },
  "intensicare.ops.degradation.active": {
    kind: "up_down_counter",
    unit: "{modo}",
    description: "Modos degradados ativos, por domínio de degradação (DOM-0007, ADR-0020 O5).",
    dimension: "D12",
    qas: ["QAS-0023"],
    attributeKeys: ["domain", "mode"],
    target: null,
  },
  "intensicare.ops.degradation.unsurfaced": {
    kind: "up_down_counter",
    unit: "{modo}",
    description:
      "Degradações ativas AINDA NÃO tornadas visíveis em nenhum canal. Valor diferente de zero é defeito de segurança clínica, não ruído (§20: nunca ocultar degradação).",
    dimension: "D12",
    qas: ["QAS-0023"],
    attributeKeys: ["domain", "mode"],
    target: null,
  },
  "intensicare.probe.run.total": {
    kind: "counter",
    unit: "{execucao}",
    description: "Execuções de sonda sintética ponta a ponta, por desfecho (§9.4).",
    dimension: "D12",
    qas: ["QAS-0023"],
    attributeKeys: ["probe.ref", "outcome"],
    target: null,
  },
  "intensicare.probe.loop.duration": {
    kind: "histogram",
    unit: "ms",
    description: "Duração do laço avaliação→alerta exercitado pela sonda sintética.",
    dimension: "D12",
    qas: ["QAS-0023"],
    attributeKeys: ["probe.ref"],
    target: null,
  },
} as const satisfies Record<string, InstrumentSpec>;

export type MetricName = keyof typeof METRIC_CATALOG;

type NamesOfKind<K extends InstrumentKind> = {
  [N in MetricName]: (typeof METRIC_CATALOG)[N]["kind"] extends K ? N : never;
}[MetricName];

export type CounterName = NamesOfKind<"counter">;
export type UpDownCounterName = NamesOfKind<"up_down_counter">;
export type HistogramName = NamesOfKind<"histogram">;

export const METRIC_NAMES = Object.keys(METRIC_CATALOG) as readonly MetricName[];

/**
 * Nomes de span (traces). Fechado pela mesma razão do catálogo de métricas:
 * nome de span é cardinalidade e é superfície de vazamento.
 */
export const SPAN_NAMES = [
  "clinical.evaluation",
  "clinical.alert.raise",
  "clinical.work_item.transition",
  "backbone.outbox.publish",
  "backbone.projection.rebuild",
  "ops.readiness_check",
  "probe.safety_loop",
] as const;

export type SpanName = (typeof SPAN_NAMES)[number];

/**
 * Nomes de evento de log. Não existe log de texto livre nesta camada: o
 * corpo humano em pt-BR vem de `LOG_MESSAGES_PT`, indexado pelo nome do
 * evento. Isso remove a rota de vazamento mais banal (interpolar uma
 * variável clínica dentro de uma mensagem).
 */
export const LOG_EVENTS = [
  "evaluation.completed",
  "evaluation.not_evaluated",
  "clinical_rule.activated",
  "clinical_rule.killed",
  "clinical_rule.rolled_back",
  "degradation.entered",
  "degradation.exited",
  "degradation.unsurfaced_detected",
  "outbox.depth_sampled",
  "failure.recorded",
  "readiness.evaluated",
  "probe.started",
  "probe.finished",
] as const;

export type LogEvent = (typeof LOG_EVENTS)[number];

export const LOG_MESSAGES_PT: Readonly<Record<LogEvent, string>> = {
  "evaluation.completed": "Avaliação clínica concluída.",
  "evaluation.not_evaluated":
    "Avaliação não realizada — estado explícito registrado, jamais no-fire silencioso.",
  "clinical_rule.activated": "Bundle de regra clínica ativado.",
  "clinical_rule.killed":
    "Kill switch acionado: regra clínica desligada; avaliações afetadas resolvem para não avaliado com razão de regra indisponível.",
  "clinical_rule.rolled_back":
    "Rollback de bundle de regra clínica para versão previamente aprovada.",
  "degradation.entered": "Entrada em modo degradado.",
  "degradation.exited": "Saída de modo degradado; reconciliação pós-recuperação exigida.",
  "degradation.unsurfaced_detected":
    "Degradação ativa sem canal de visibilidade — condição proibida (§20: nunca ocultar degradação).",
  "outbox.depth_sampled": "Profundidade do outbox amostrada.",
  "failure.recorded": "Falha registrada por categoria.",
  "readiness.evaluated": "Prontidão avaliada como capacidade segura.",
  "probe.started": "Sonda sintética ponta a ponta iniciada.",
  "probe.finished": "Sonda sintética ponta a ponta concluída.",
};
