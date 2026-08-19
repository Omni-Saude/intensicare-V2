/**
 * apps/api/src/regras/registro.ts — REGISTRO e DESPACHANTE de regras
 * clínicas versionadas (achado §6.4, P1).
 *
 * Requisito 1 do despacho: nada de `if` disperso por rota para selecionar
 * regra. A seleção é por identidade+versão declaradas, resolvida nesta
 * tabela única. Chave desconhecida é ERRO EXPLÍCITO — nunca NEWS2 por
 * default, nunca "a única regra registrada".
 *
 * Ordem de portas (todas fail-closed, nesta ordem):
 *   1. regra registrada?                    → não: `RegraNaoRegistradaError`
 *   2. quadro de chaves de runtime ligado?  → não: `regra_indisponivel`
 *   3. artefato de regra disponível?        → não: motivo da porta de bundle
 *   4. motor reproduz o `behaviorHash`?     → não: `motor_divergente`
 *   5. avaliação, sob `guardEvaluation`     → o callback só é invocado aqui
 *
 * Toda saída — avaliada ou recusada — produz um REGISTRO IMUTÁVEL
 * (requisito 5) com versão de regra, versão de bundle, digest das entradas,
 * razões, proveniência e correlação.
 *
 * Nenhuma regra clínica, limiar, janela ou banda vive neste arquivo.
 */
import type { ClinicalRuleSwitchboard } from "@intensicare/observabilidade";
import type { EstadoDeBundle, PortaDeBundle } from "./bundle.js";
import {
  BUNDLE_INEXISTENTE,
  chaveRegra,
  congelarRegistro,
  type DigestDeEntradas,
  ehAcionavel,
  type IdentidadeRegra,
  MOTIVO_RECUSA_PT,
  type ModoDespacho,
  type MotivoRecusa,
  type ProvenienciaBundle,
  type RegistroDeAvaliacao,
  ROTULO_NAO_AVALIADO_PT,
  ROTULO_SOMBRA_PT,
} from "./tipos.js";

/** Verificação do motor em execução contra o comportamento pinado no bundle. */
export type VerificacaoDeMotor =
  | { readonly ok: true; readonly behaviorHash: string | null }
  | { readonly ok: false; readonly esperado: string; readonly obtido: string };

/** Contexto de um despacho: instante e correlação vêm de fora, sempre. */
export interface ContextoDespacho {
  readonly instanteIso: string;
  readonly correlacaoId: string;
}

/**
 * Provedor de uma regra: liga identidade+porta de bundle a um avaliador.
 * O avaliador é sempre o kernel real; este objeto só o apresenta ao
 * despachante — não contém regra clínica.
 */
export interface ProvedorDeRegra<E, R> {
  readonly identidade: IdentidadeRegra;
  readonly porta: PortaDeBundle;
  /** Recebe a proveniência ativa para conferir o `behaviorHash` pinado. */
  verificarMotor(proveniencia: ProvenienciaBundle): VerificacaoDeMotor;
  digestDeEntradas(insumo: E): DigestDeEntradas;
  avaliar(insumo: E, instanteIso: string): R;
  razoesDe(resultado: R): readonly string[];
}

/** Resultado de um despacho. */
export type Despacho<R> =
  | {
      readonly tipo: "avaliada";
      readonly resultado: R;
      readonly registro: RegistroDeAvaliacao;
    }
  | { readonly tipo: "nao_avaliada"; readonly registro: RegistroDeAvaliacao };

/** Erro explícito de regra não registrada. NUNCA há fallback para outra regra. */
export class RegraNaoRegistradaError extends Error {
  readonly chaveSolicitada: string;
  readonly chavesRegistradas: readonly string[];

  constructor(chaveSolicitada: string, chavesRegistradas: readonly string[]) {
    super(
      `regra não registrada: "${chaveSolicitada}". ` +
        `Nenhuma avaliação foi executada e nenhuma outra regra foi usada em seu lugar. ` +
        `Registradas: [${chavesRegistradas.join(", ")}]`,
    );
    this.name = "RegraNaoRegistradaError";
    this.chaveSolicitada = chaveSolicitada;
    this.chavesRegistradas = [...chavesRegistradas];
  }
}

// ---------------------------------------------------------------------------
// CATÁLOGO DE AUTORIDADE (ACH-REV8-3)
// ---------------------------------------------------------------------------

/**
 * O artefato que ESTE processo carregou e cuja porta o reconhece como
 * disponível no instante consultado.
 *
 * POR QUE ISTO EXISTE. `acionavel` era derivado, na leitura, de
 * `ehAcionavel` aplicado à proveniência lida do PRÓPRIO registro persistido.
 * Registro e proveniência vinham do mesmo blob: quem controlasse o blob
 * controlava os dois lados da comparação, e uma forja internamente coerente
 * (assinatura verificada + zero bloqueios + modo acionável) publicava
 * `acionavel: true` sem que autoridade alguma fosse consultada (ACH-REV8-3,
 * reproduzido contra o servidor real antes desta mudança).
 *
 * A autoridade não vem — e não pode vir — de uma assinatura DO REGISTRO: o
 * registro é dado, não artefato de regra. Ela vem do estado do runtime: qual
 * bundle a `PortaDeBundle` reconhece como disponível AGORA, com que modo e
 * que proveniência. O registro persistido passa a ser apenas CHAVE DE JUNÇÃO
 * (`chaveRegra` + `versaoBundle` + `behaviorHash` + `digestManifesto`).
 *
 * Isto NÃO depende de ADR-0007 C5 (custódia de chave), que segue ABERTA:
 * fechar C5 é o que permitiria `assinatura === "assinatura_verificada"` ser
 * VERDADE para um artefato real. Aqui só se exige que a alegação venha de
 * quem tem autoridade para fazê-la — o que é fail-closed na direção segura.
 */
export interface AutoridadeDeRegra {
  readonly chaveRegra: string;
  readonly modo: ModoDespacho;
  readonly proveniencia: ProvenienciaBundle;
}

/**
 * Fonte de AUTORIDADE para publicação de acionabilidade. Implementado por
 * `RegistroDeRegras` — é o mesmo objeto que despacha, de propósito: duas
 * fontes de "qual bundle está ativo" seriam exatamente a deriva que o
 * `behaviorHash` existe para pegar.
 */
export interface CatalogoDeAutoridade {
  /** `null` ⇒ nenhuma autoridade para esta regra neste instante. */
  autoridadeDe(chaveRegra: string, instanteIso: string): AutoridadeDeRegra | null;
}

/** Forma apagada de tipo, para a tabela heterogênea do registro. */
interface ProvedorOpaco {
  readonly identidade: IdentidadeRegra;
  readonly porta: PortaDeBundle;
  readonly verificarMotor: (proveniencia: ProvenienciaBundle) => VerificacaoDeMotor;
  readonly digestDeEntradas: (insumo: unknown) => DigestDeEntradas;
  readonly avaliar: (insumo: unknown, instanteIso: string) => unknown;
  readonly razoesDe: (resultado: unknown) => readonly string[];
}

function apagarTipo<E, R>(provedor: ProvedorDeRegra<E, R>): ProvedorOpaco {
  return {
    identidade: provedor.identidade,
    porta: provedor.porta,
    verificarMotor: (p) => provedor.verificarMotor(p),
    // Conversões confinadas a este ponto: a tabela é heterogênea por
    // natureza (NEWS2 e GCS têm insumos e saídas distintos e NÃO
    // compartilham forma — ver requisito 6, "zero contaminação").
    digestDeEntradas: (insumo) => provedor.digestDeEntradas(insumo as E),
    avaliar: (insumo, instanteIso) => provedor.avaliar(insumo as E, instanteIso),
    razoesDe: (resultado) => provedor.razoesDe(resultado as R),
  };
}

export interface OpcoesRegistroDeRegras {
  /**
   * Quadro de chaves de runtime da observabilidade. Opcional: quando
   * ausente, apenas o kill switch do livro-razão governa. Quando presente,
   * a união das duas primitivas governa — qualquer uma desligada recusa.
   */
  readonly quadroDeChaves?: ClinicalRuleSwitchboard | undefined;
}

export class RegistroDeRegras implements CatalogoDeAutoridade {
  private readonly provedores = new Map<string, ProvedorOpaco>();
  private readonly quadroDeChaves: ClinicalRuleSwitchboard | undefined;

  constructor(opcoes: OpcoesRegistroDeRegras = {}) {
    this.quadroDeChaves = opcoes.quadroDeChaves;
  }

  /** Registra um provedor. Chave duplicada é erro — identidade é única. */
  registrar<E, R>(provedor: ProvedorDeRegra<E, R>): this {
    const chave = chaveRegra(provedor.identidade);
    if (this.provedores.has(chave)) {
      throw new Error(`regra já registrada: "${chave}"`);
    }
    if (chaveRegra(provedor.porta.identidade) !== chave) {
      throw new Error(
        `porta de bundle de "${chaveRegra(provedor.porta.identidade)}" ` +
          `não pode governar a regra "${chave}"`,
      );
    }
    this.provedores.set(chave, apagarTipo(provedor));
    return this;
  }

  chaves(): readonly string[] {
    return [...this.provedores.keys()].sort();
  }

  temRegra(chave: string): boolean {
    return this.provedores.has(chave);
  }

  /**
   * AUTORIDADE de uma regra no instante consultado (ACH-REV8-3).
   *
   * Reusa EXATAMENTE as portas 2 e 3 de `despachar` — quadro de chaves de
   * runtime e porta de bundle —, na mesma ordem e com o mesmo veredito. Não
   * há segunda definição de "esta regra pode governar agora": se o
   * despachante recusaria, não há autoridade, e um registro daquela regra
   * não é publicável como acionável.
   *
   * `null` cobre, sem distinguir para o chamador (a distinção vive no
   * registro imutável do despacho, que é a trilha de auditoria):
   * regra não registrada, regra desligada/desconhecida no quadro de chaves,
   * e porta de bundle que recusa (artefato ausente, não verificado,
   * não ativado, indisponível).
   */
  autoridadeDe(chave: string, instanteIso: string): AutoridadeDeRegra | null {
    const provedor = this.provedores.get(chave);
    if (provedor === undefined) return null;

    const quadro = this.quadroDeChaves;
    if (quadro !== undefined) {
      const disponibilidade = quadro.availabilityOf(provedor.identidade.ruleId);
      if (
        disponibilidade.kind === "killed" ||
        disponibilidade.kind === "load_failed" ||
        disponibilidade.kind === "unknown"
      ) {
        return null;
      }
    }

    const estado = provedor.porta.estadoEm(instanteIso);
    if (estado.tipo !== "disponivel") return null;

    return Object.freeze({
      chaveRegra: chave,
      modo: estado.modo,
      proveniencia: estado.proveniencia,
    });
  }

  /**
   * Despacha uma avaliação. Lança `RegraNaoRegistradaError` para chave
   * desconhecida — a recusa mais explícita possível, impossível de
   * confundir com uma avaliação e impossível de degradar em default.
   */
  despachar<E, R>(chave: string, insumo: E, contexto: ContextoDespacho): Despacho<R> {
    const provedor = this.provedores.get(chave);
    if (provedor === undefined) {
      throw new RegraNaoRegistradaError(chave, this.chaves());
    }

    const entradas = provedor.digestDeEntradas(insumo);
    const base = {
      chave,
      identidade: provedor.identidade,
      contexto,
      entradas,
    } as const;

    // Porta 2 — quadro de chaves de runtime (kill switch da observabilidade).
    const quadro = this.quadroDeChaves;
    if (quadro !== undefined) {
      const disponibilidade = quadro.availabilityOf(provedor.identidade.ruleId);
      if (disponibilidade.kind === "killed" || disponibilidade.kind === "load_failed") {
        return this.recusar(base, "regra_indisponivel", BUNDLE_INEXISTENTE, [
          `quadro de chaves: ${disponibilidade.kind}`,
        ]);
      }
      if (disponibilidade.kind === "unknown") {
        return this.recusar(base, "regra_indisponivel", BUNDLE_INEXISTENTE, [
          "quadro de chaves: regra nunca ativada em runtime (fail-closed)",
        ]);
      }
    }

    // Porta 3 — artefato de regra.
    const estado: EstadoDeBundle = provedor.porta.estadoEm(contexto.instanteIso);
    if (estado.tipo === "recusado") {
      return this.recusar(base, estado.motivo, estado.proveniencia, estado.detalhes);
    }

    // Porta 4 — motor reproduz o comportamento pinado.
    const motor = provedor.verificarMotor(estado.proveniencia);
    if (!motor.ok) {
      return this.recusar(base, "motor_divergente", estado.proveniencia, [
        `behaviorHash esperado ${motor.esperado}, obtido ${motor.obtido}`,
      ]);
    }

    // Porta 5 — avaliação, sob a guarda de runtime quando houver quadro.
    let resultado: unknown;
    if (quadro !== undefined) {
      const guardado = quadro.guardEvaluation(provedor.identidade.ruleId, () =>
        provedor.avaliar(insumo, contexto.instanteIso),
      );
      if (guardado.kind === "not_evaluated") {
        return this.recusar(
          base,
          "regra_indisponivel",
          estado.proveniencia,
          [guardado.notice.mensagemUi],
          guardado.notice.mensagemUi,
        );
      }
      resultado = guardado.value;
    } else {
      resultado = provedor.avaliar(insumo, contexto.instanteIso);
    }

    const registro = congelarRegistro({
      correlacaoId: contexto.correlacaoId,
      chaveRegra: chave,
      ruleId: provedor.identidade.ruleId,
      ruleVersion: provedor.identidade.ruleVersion,
      despachadoEm: contexto.instanteIso,
      desfecho: "avaliada",
      motivoRecusa: null,
      mensagemRecusaPt: null,
      modo: estado.modo,
      acionavel: ehAcionavel(estado.proveniencia, estado.modo),
      rotuloPt: ROTULO_SOMBRA_PT,
      bundle: estado.proveniencia,
      entradas,
      razoes: [...provedor.razoesDe(resultado)],
    });

    return { tipo: "avaliada", resultado: resultado as R, registro };
  }

  private recusar<R>(
    base: {
      readonly chave: string;
      readonly identidade: IdentidadeRegra;
      readonly contexto: ContextoDespacho;
      readonly entradas: DigestDeEntradas;
    },
    motivo: MotivoRecusa,
    proveniencia: ProvenienciaBundle,
    detalhes: readonly string[],
    mensagemPt?: string,
  ): Despacho<R> {
    const registro = congelarRegistro({
      correlacaoId: base.contexto.correlacaoId,
      chaveRegra: base.chave,
      ruleId: base.identidade.ruleId,
      ruleVersion: base.identidade.ruleVersion,
      despachadoEm: base.contexto.instanteIso,
      desfecho: "nao_avaliada",
      motivoRecusa: motivo,
      mensagemRecusaPt: mensagemPt ?? MOTIVO_RECUSA_PT[motivo],
      modo: null,
      acionavel: false,
      rotuloPt: ROTULO_NAO_AVALIADO_PT,
      bundle: proveniencia,
      entradas: base.entradas,
      razoes: [motivo, ...detalhes],
    });
    return { tipo: "nao_avaliada", registro };
  }
}
