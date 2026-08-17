/**
 * apps/api/src/regras/tipos.ts — vocabulário do REGISTRO/DESPACHANTE de
 * regras clínicas versionadas (achado §6.4, P1).
 *
 * Este módulo define APENAS estrutura de despacho e proveniência. Nenhuma
 * regra clínica, limiar, janela, banda de severidade, vetor de referência
 * ou texto clínico normativo vive aqui: a regra é do
 * `@intensicare/kernel-clinico`, o empacotamento/assinatura é do
 * `@intensicare/rule-bundle` e a política de degradação é da
 * `@intensicare/observabilidade`.
 *
 * Racional (ADR-0007 formato/assinatura/ativação/rollback; ADR-0008 estados
 * de avaliação e §8.3 `rule_unavailable`; ADR-0025 identidade de edição):
 * a seleção de regra é por IDENTIDADE + VERSÃO declaradas, resolvida numa
 * tabela única — nunca por `if` disperso em rota, nunca por default.
 *
 * Estado factual preservado: 0 vias clínicas acionáveis. `ehAcionavel` é
 * uma função DERIVADA, jamais um campo atribuível: exige simultaneamente
 * cadeia de assinatura verificada, modo de ativação `acionavel` no livro-
 * razão e zero bloqueios de prontidão. O livro-razão do `rule-bundle`
 * recusa `actionable` enquanto houver bloqueio, e o bundle real do
 * RULE-NEWS2 0.2.0 acumula vários — logo nenhuma via passa a acionável por
 * este caminho.
 */

/** Identidade versionada de uma regra clínica (ADR-0025 A25-1). */
export interface IdentidadeRegra {
  readonly ruleId: string;
  readonly ruleVersion: string;
}

/**
 * Chave de identidade do registro: `<ruleId>@<ruleVersion>`. É exatamente a
 * mesma forma do `bundleId` do manifesto (`rule-bundle` types.ts §bundleId),
 * para que identidade de despacho e identidade de artefato não divirjam.
 */
export function chaveRegra(identidade: IdentidadeRegra): string {
  return `${identidade.ruleId}@${identidade.ruleVersion}`;
}

/** Interpreta uma chave `<ruleId>@<ruleVersion>`; `null` se malformada. */
export function analisarChaveRegra(chave: string): IdentidadeRegra | null {
  const separador = chave.lastIndexOf("@");
  if (separador <= 0 || separador === chave.length - 1) return null;
  return {
    ruleId: chave.slice(0, separador),
    ruleVersion: chave.slice(separador + 1),
  };
}

/**
 * Modo de despacho — espelha `ActivationMode` do `rule-bundle` (ADR-0007
 * eixo 4). `sombra`: avaliação computada e explicitamente rotulada como NÃO
 * acionável. `acionavel`: reservado, inalcançável hoje (ver `ehAcionavel`).
 */
export type ModoDespacho = "sombra" | "acionavel";

/** Estado da cadeia de assinatura do artefato que governa o despacho. */
export type EstadoAssinatura = "assinatura_verificada" | "assinatura_ausente" | "sem_bundle";

/**
 * Razões de recusa de despacho. Vocabulário FECHADO e legível por máquina —
 * nunca texto livre (texto livre em razão é rota de PHI e é inauditável,
 * mesma disciplina de `KILL_REASON_CODES` da observabilidade).
 */
export type MotivoRecusa =
  | "regra_nao_registrada"
  | "bundle_ausente"
  | "bundle_nao_verificado"
  | "motor_divergente"
  | "regra_nao_ativada"
  | "regra_indisponivel";

/** Texto pt-BR VISÍVEL de cada recusa (ADR-0008 §8.3: nunca no-fire silencioso). */
export const MOTIVO_RECUSA_PT: Readonly<Record<MotivoRecusa, string>> = {
  regra_nao_registrada:
    "Regra não registrada neste serviço: nenhuma avaliação foi executada e nenhuma outra regra foi usada em seu lugar.",
  bundle_ausente:
    "Não há pacote de regra (bundle) verificável para esta regra: as avaliações NÃO foram calculadas. Isto não significa ausência de risco.",
  bundle_nao_verificado:
    "A verificação do pacote de regra falhou (assinatura, digest ou chave): avaliação recusada fail-closed.",
  motor_divergente:
    "O motor em execução não reproduz o comportamento pinado no pacote de regra: avaliação recusada fail-closed.",
  regra_nao_ativada:
    "Nenhuma versão desta regra está ativa neste escopo: as avaliações NÃO foram calculadas.",
  regra_indisponivel:
    "Regra clínica indisponível: as avaliações deste período NÃO foram calculadas. Isto não significa ausência de risco.",
};

/**
 * Rótulo pt-BR obrigatório da saída em modo sombra. Requisito 3 do despacho
 * §6.4: quando o bundle não satisfaz pré-condições de acionabilidade, só é
 * permitida avaliação sintética/sombra EXPLICITAMENTE ROTULADA.
 */
export const ROTULO_SOMBRA_PT =
  "SOMBRA — avaliação consultiva sobre dados sintéticos, NÃO acionável: nenhuma recomendação, ordem ou conduta clínica decorre deste resultado.";

/** Rótulo pt-BR de uma recusa (nunca há saída clínica a rotular). */
export const ROTULO_NAO_AVALIADO_PT =
  "NÃO AVALIADO — nenhuma avaliação clínica foi produzida; a ausência de resultado não é ausência de risco.";

/** Digest canônico das entradas que alimentaram a avaliação. */
export interface DigestDeEntradas {
  /** Quantidade de observações apresentadas à regra. */
  readonly total: number;
  /** Digest `sha256:<hex>` da projeção canônica das entradas. */
  readonly digest: string;
}

/** Proveniência do artefato de regra que governou este despacho. */
export interface ProvenienciaBundle {
  readonly versaoBundle: string | null;
  readonly digestManifesto: string | null;
  readonly behaviorHash: string | null;
  readonly assinatura: EstadoAssinatura;
  readonly autorKeyId: string | null;
  readonly aprovadorKeyId: string | null;
  readonly bloqueiosDeAtivacao: readonly string[];
  readonly ativoDesde: string | null;
}

/**
 * REGISTRO IMUTÁVEL de um despacho (requisito 5 do §6.4). Carrega versão de
 * regra, versão de bundle, digest das entradas, razões, proveniência e
 * correlação. Congelado em profundidade por `congelarRegistro`.
 */
export interface RegistroDeAvaliacao {
  readonly correlacaoId: string;
  readonly chaveRegra: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly despachadoEm: string;
  readonly desfecho: "avaliada" | "nao_avaliada";
  readonly motivoRecusa: MotivoRecusa | null;
  /** Texto pt-BR visível da recusa (ou `null` quando houve avaliação). */
  readonly mensagemRecusaPt: string | null;
  readonly modo: ModoDespacho | null;
  /** DERIVADO por `ehAcionavel` — nunca atribuído por chamador. */
  readonly acionavel: boolean;
  readonly rotuloPt: string;
  readonly bundle: ProvenienciaBundle;
  readonly entradas: DigestDeEntradas;
  readonly razoes: readonly string[];
}

/**
 * Acionabilidade DERIVADA. As três condições são cumulativas e nenhuma
 * delas é decidível por este serviço:
 * 1. cadeia autor≠aprovador verificada contra chaveiro conhecido (ADR-0007
 *    eixos 2 e 3);
 * 2. modo de ativação `acionavel` no livro-razão (ADR-0007 eixo 4 — o
 *    livro-razão recusa esse modo enquanto houver bloqueio de prontidão);
 * 3. zero bloqueios de prontidão declarados no manifesto.
 */
export function ehAcionavel(bundle: ProvenienciaBundle, modo: ModoDespacho | null): boolean {
  return (
    bundle.assinatura === "assinatura_verificada" &&
    modo === "acionavel" &&
    bundle.bloqueiosDeAtivacao.length === 0
  );
}

/** Proveniência de um despacho sem qualquer artefato de regra associado. */
export const BUNDLE_INEXISTENTE: ProvenienciaBundle = Object.freeze({
  versaoBundle: null,
  digestManifesto: null,
  behaviorHash: null,
  assinatura: "sem_bundle" as const,
  autorKeyId: null,
  aprovadorKeyId: null,
  bloqueiosDeAtivacao: Object.freeze([]) as readonly string[],
  ativoDesde: null,
});

/** Congela o registro e suas listas — imutabilidade imposta, não prometida. */
export function congelarRegistro(registro: RegistroDeAvaliacao): RegistroDeAvaliacao {
  Object.freeze(registro.razoes);
  Object.freeze(registro.entradas);
  Object.freeze(registro.bundle.bloqueiosDeAtivacao);
  Object.freeze(registro.bundle);
  return Object.freeze(registro);
}
