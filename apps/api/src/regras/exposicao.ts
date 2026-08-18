/**
 * apps/api/src/regras/exposicao.ts — PROJEÇÃO PUBLICÁVEL do registro
 * imutável de despacho (LAC-L2; QAS-0023).
 *
 * O PROBLEMA QUE ESTE MÓDULO RESOLVE
 * ----------------------------------
 * `RegistroDeAvaliacao` (`./tipos.js`) é computado a cada despacho e gravado
 * no outbox como `regra-despachada`, mas NÃO atravessa nenhuma resposta HTTP:
 * `OUTBOX_TO_CONTRACT_EVENT` (`apps/api/src/db.ts`) o omite de propósito
 * (não pertence ao vocabulário de `EventoFluxo`) e nenhum campo de
 * `ResultadoAvaliacao` carrega o modo. Consequência OBSERVADA: a superfície
 * não tem como saber que a avaliação é SOMBRA e NÃO é acionável — o único
 * sinal indireto é `/v1/readyz` em 503. Isso é uma degradação sem
 * representação visível ao usuário, exatamente o que QAS-0023 exige que seja
 * zero.
 *
 * O QUE ESTE MÓDULO NÃO FAZ — e não pode fazer
 * --------------------------------------------
 * 1. NÃO promove nada a acionável. `acionavel` NUNCA é copiado do registro:
 *    é RECALCULADO aqui por `ehAcionavel` a partir da proveniência exposta.
 *    Nenhum chamador — nem um registro forjado, nem uma linha adulterada no
 *    banco — consegue publicar `acionavel: true` enquanto o artefato não
 *    tiver cadeia de assinatura verificada, modo `acionavel` no livro-razão e
 *    zero bloqueios de prontidão. Estado factual preservado: 0 vias clínicas
 *    acionáveis; 47/47 inelegíveis.
 * 2. NÃO altera semântica clínica, limiar, janela, banda ou vetor. Nenhum
 *    número clínico é lido, escrito ou derivado aqui.
 * 3. NÃO publica PHI nem identificador de sujeito. Ver
 *    `CAMPOS_RETIDOS_DO_REGISTRO`: `correlacaoId`, `entradas` (total +
 *    digest) e `razoes` ficam RETIDOS no registro durável do outbox, que é
 *    trilha de auditoria interna, e não viajam na resposta.
 *
 * Rastreio: ADR-0007 (formato/assinatura/aprovação/ativação/rollback, C5
 * aberta), ADR-0008 §8.3 (recusa nunca é no-fire silencioso), ADR-0020 O5
 * (o aviso de degradação atravessa a fronteira), QAS-0023, HAZ-0005,
 * LAC-L2.
 */
import type { ResultadoAvaliacao } from "@intensicare/contratos";
import { resultadoNaoAvaliadoNews2, type SaidaNews2 } from "./news2.js";
import type { Despacho } from "./registro.js";
import {
  type EstadoAssinatura,
  ehAcionavel,
  MOTIVO_RECUSA_PT,
  type ModoDespacho,
  type MotivoRecusa,
  type RegistroDeAvaliacao,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Forma exposta
// ---------------------------------------------------------------------------

/**
 * Proveniência PUBLICÁVEL do artefato de regra que governou o despacho.
 *
 * É `ProvenienciaBundle` MENOS `autorKeyId` e `aprovadorKeyId`: identificador
 * de chave é material de custódia (ADR-0007 eixos 2 e 3) e não é necessário
 * para representar a degradação. Publicá-lo só ampliaria a superfície de
 * ataque sobre a cadeia de assinatura — e a separação autor≠aprovador
 * continua sendo verificada onde importa, no `rule-bundle`.
 *
 * Nenhum campo aqui é derivado de dado de paciente: são metadados do
 * ARTEFATO (versão, digests, estado de assinatura, bloqueios, ativação).
 */
export interface ProvenienciaBundleExposta {
  readonly versaoBundle: string | null;
  readonly digestManifesto: string | null;
  /** Hash do comportamento pinado no artefato — é o que PROVA um rollback. */
  readonly behaviorHash: string | null;
  readonly assinatura: EstadoAssinatura;
  /** Códigos de bloqueio de prontidão do `rule-bundle`; vazio ⇒ sem bloqueio. */
  readonly bloqueiosDeAtivacao: readonly string[];
  readonly ativoDesde: string | null;
}

/**
 * MODO DE DESPACHO exposto à superfície. É a representação visível da
 * degradação: enquanto `acionavel` for `false`, nenhuma recomendação, ordem
 * ou conduta clínica decorre da avaliação que o acompanha.
 *
 * `modo` sozinho NÃO autoriza nada — ele espelha o `ActivationMode` do
 * livro-razão (`shadow`/`actionable`); quem decide acionabilidade é
 * `acionavel`, que é derivado e cumulativo (assinatura verificada + modo
 * `acionavel` + zero bloqueios).
 */
export interface ModoDeDespachoAvaliacao {
  readonly desfecho: "avaliada" | "nao_avaliada";
  /** `null` quando o despacho foi recusado antes de haver modo de ativação. */
  readonly modo: ModoDespacho | null;
  /** DERIVADO nesta projeção — nunca copiado, nunca atribuível por chamador. */
  readonly acionavel: boolean;
  /** Rótulo pt-BR obrigatório da saída (sombra rotulada ou não avaliado). */
  readonly rotuloPt: string;
  readonly motivoRecusa: MotivoRecusa | null;
  /** Texto pt-BR VISÍVEL da recusa; `null` quando houve avaliação. */
  readonly mensagemRecusaPt: string | null;
  /** `<ruleId>@<ruleVersion>` — igual a `ResultadoAvaliacao.versaoRegra`. */
  readonly versaoRegra: string;
  readonly despachadoEm: string;
  readonly bundle: ProvenienciaBundleExposta;
}

/** `T` acrescido do envelope de modo de despacho, sem tocar em `T`. */
export type ComModoDeDespacho<T> = T & { readonly despacho: ModoDeDespachoAvaliacao };

/**
 * Campos do `RegistroDeAvaliacao` deliberadamente RETIDOS (não publicados),
 * com a razão de cada um. Existe como dado, e não como comentário, para que
 * `exposicao.test.ts` prove que todo campo do registro foi classificado —
 * um campo novo no registro reprova o teste até alguém decidir seu destino.
 *
 * - `correlacaoId`: alça de correlação com o envelope de ingestão. Não é
 *   necessária para representar a degradação e publicá-la criaria um canal
 *   de correlação entre requisições dentro de um corpo de resposta.
 * - `entradas`: `total` + `digest` das observações. O digest é calculado
 *   sobre um espaço de baixa entropia (um punhado de sinais vitais) e, por
 *   isso, funciona como oráculo de confirmação de valores clínicos — é
 *   canal de inferência sobre o sujeito, não metadado de artefato.
 * - `razoes`: na avaliação são os códigos do kernel, JÁ publicados em
 *   `ResultadoAvaliacao.motivos`; na recusa incluem detalhes de mecanismo
 *   interno. O texto visível da recusa vai em `mensagemRecusaPt`.
 * - `ruleId`/`ruleVersion`: publicados de forma composta em `versaoRegra`.
 */
export const CAMPOS_RETIDOS_DO_REGISTRO: readonly (keyof RegistroDeAvaliacao)[] = Object.freeze([
  "correlacaoId",
  "entradas",
  "razoes",
  "ruleId",
  "ruleVersion",
]);

/** Campos do registro que alimentam a projeção publicável. */
export const CAMPOS_PUBLICADOS_DO_REGISTRO: readonly (keyof RegistroDeAvaliacao)[] = Object.freeze([
  "chaveRegra",
  "despachadoEm",
  "desfecho",
  "motivoRecusa",
  "mensagemRecusaPt",
  "modo",
  "acionavel",
  "rotuloPt",
  "bundle",
]);

/**
 * Registro cujo `acionavel` não corresponde à derivação — ou seja, registro
 * FABRICADO. Falha alto, e não em silêncio: sanear caladamente um registro
 * forjado esconderia justamente o defeito que importa.
 */
export class DespachoIncoerenteError extends Error {
  readonly chaveRegra: string;
  readonly acionavelDeclarado: boolean;
  readonly acionavelDerivado: boolean;

  constructor(chaveRegra: string, declarado: boolean, derivado: boolean) {
    super(
      `registro de despacho incoerente para "${chaveRegra}": ` +
        `acionavel declarado ${String(declarado)}, derivado ${String(derivado)}. ` +
        `Acionabilidade é DERIVADA (assinatura verificada + modo acionável + zero bloqueios) ` +
        `e nunca atribuída; um registro que a declara sozinho é fabricado e não é publicável.`,
    );
    this.name = "DespachoIncoerenteError";
    this.chaveRegra = chaveRegra;
    this.acionavelDeclarado = declarado;
    this.acionavelDerivado = derivado;
  }
}

/**
 * Recalcula a acionabilidade a partir da proveniência EXPOSTA, reusando a
 * mesma função de `./tipos.js` — uma única definição da regra de
 * acionabilidade, não duas. `autorKeyId`/`aprovadorKeyId` entram como `null`
 * porque `ehAcionavel` não os lê (ele exige `assinatura_verificada`, que já
 * é consequência de a cadeia autor≠aprovador ter sido verificada no
 * `rule-bundle`); a derivação sobre a forma exposta é, portanto, idêntica à
 * derivação sobre a forma completa.
 */
export function derivarAcionavel(
  bundle: ProvenienciaBundleExposta,
  modo: ModoDespacho | null,
): boolean {
  return ehAcionavel({ ...bundle, autorKeyId: null, aprovadorKeyId: null }, modo);
}

/**
 * Projeta o registro imutável na forma publicável.
 *
 * Lança `DespachoIncoerenteError` quando o registro declara `acionavel`
 * divergente da derivação. No caminho real isso é impossível — o despachante
 * já deriva o campo —, e é exatamente por isso que a divergência só pode
 * significar registro fabricado.
 */
export function projetarModoDeDespacho(registro: RegistroDeAvaliacao): ModoDeDespachoAvaliacao {
  const bundle: ProvenienciaBundleExposta = Object.freeze({
    versaoBundle: registro.bundle.versaoBundle,
    digestManifesto: registro.bundle.digestManifesto,
    behaviorHash: registro.bundle.behaviorHash,
    assinatura: registro.bundle.assinatura,
    bloqueiosDeAtivacao: Object.freeze([...registro.bundle.bloqueiosDeAtivacao]),
    ativoDesde: registro.bundle.ativoDesde,
  });

  const acionavel = derivarAcionavel(bundle, registro.modo);
  if (acionavel !== registro.acionavel) {
    throw new DespachoIncoerenteError(registro.chaveRegra, registro.acionavel, acionavel);
  }

  return Object.freeze({
    desfecho: registro.desfecho,
    modo: registro.modo,
    acionavel,
    rotuloPt: registro.rotuloPt,
    motivoRecusa: registro.motivoRecusa,
    mensagemRecusaPt: registro.mensagemRecusaPt,
    versaoRegra: registro.chaveRegra,
    despachadoEm: registro.despachadoEm,
    bundle,
  });
}

/**
 * Anexa o envelope de modo de despacho a um resultado de avaliação, seja ele
 * do NEWS2 (`ResultadoAvaliacao`) ou do GCS (`ResultadoAvaliacaoGcs`).
 *
 * É genérico de propósito: o envelope é o MESMO para qualquer regra, e o
 * resultado permanece intocado — nenhum campo de uma regra entra na outra
 * (requisito de não contaminação do achado §6.4).
 */
export function comModoDeDespacho<T extends object>(
  avaliacao: T,
  registro: RegistroDeAvaliacao,
): ComModoDeDespacho<T> {
  return Object.freeze({
    ...avaliacao,
    despacho: projetarModoDeDespacho(registro),
  }) as ComModoDeDespacho<T>;
}

/**
 * Ponto ÚNICO de composição do resultado publicável do NEWS2, para os dois
 * desfechos possíveis. Existe para que o chamador não possa anexar o
 * envelope em um ramo e esquecer no outro: a recusa é justamente o ramo que
 * PRECISA ser visível (ADR-0008 §8.3), e é o que mais fácil se esquece.
 *
 * Preserva HAZ-0005 sem exceção: na recusa, `resultadoNaoAvaliadoNews2`
 * devolve escore `null` (jamais `0`) e banda `null`.
 */
export function resultadoNews2Publicavel(
  despacho: Despacho<SaidaNews2>,
): ComModoDeDespacho<ResultadoAvaliacao> {
  const avaliacao =
    despacho.tipo === "avaliada"
      ? despacho.resultado.resultado
      : resultadoNaoAvaliadoNews2(despacho.registro);
  return comModoDeDespacho(avaliacao, despacho.registro);
}

// ---------------------------------------------------------------------------
// Leitura do envelope já persistido (caminho de leitura)
// ---------------------------------------------------------------------------

const MOTIVOS_RECUSA: ReadonlySet<string> = new Set(Object.keys(MOTIVO_RECUSA_PT));
const ASSINATURAS: ReadonlySet<string> = new Set<EstadoAssinatura>([
  "assinatura_verificada",
  "assinatura_ausente",
  "sem_bundle",
]);

function ehTextoOuNulo(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function lerBundle(bruto: unknown): ProvenienciaBundleExposta | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.assinatura !== "string" || !ASSINATURAS.has(b.assinatura)) return null;
  if (!Array.isArray(b.bloqueiosDeAtivacao)) return null;
  if (!b.bloqueiosDeAtivacao.every((x): x is string => typeof x === "string")) return null;
  if (
    !ehTextoOuNulo(b.versaoBundle) ||
    !ehTextoOuNulo(b.digestManifesto) ||
    !ehTextoOuNulo(b.behaviorHash) ||
    !ehTextoOuNulo(b.ativoDesde)
  ) {
    return null;
  }
  return Object.freeze({
    versaoBundle: b.versaoBundle,
    digestManifesto: b.digestManifesto,
    behaviorHash: b.behaviorHash,
    assinatura: b.assinatura as EstadoAssinatura,
    bloqueiosDeAtivacao: Object.freeze([...(b.bloqueiosDeAtivacao as string[])]),
    ativoDesde: b.ativoDesde,
  });
}

/**
 * Lê o envelope de modo de despacho de um `ResultadoAvaliacao` já
 * PERSISTIDO, fail-closed.
 *
 * Devolve `null` — que o contrato define como "modo de despacho não
 * registrado, trate como NÃO acionável" — em três casos: campo ausente
 * (linha gravada antes desta versão), forma inválida, ou `acionavel`
 * armazenado divergente da derivação (linha adulterada ou corrompida). Nunca
 * lança: uma linha ruim não pode derrubar a leitura da grade inteira, e
 * nunca promove: `acionavel` é sempre recalculado da proveniência lida.
 */
export function lerModoDeDespacho(bruto: unknown): ModoDeDespachoAvaliacao | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const d = bruto as Record<string, unknown>;

  const desfecho = d.desfecho;
  if (desfecho !== "avaliada" && desfecho !== "nao_avaliada") return null;

  const modo = d.modo;
  if (modo !== null && modo !== "sombra" && modo !== "acionavel") return null;

  const motivoRecusa = d.motivoRecusa;
  if (
    motivoRecusa !== null &&
    !(typeof motivoRecusa === "string" && MOTIVOS_RECUSA.has(motivoRecusa))
  )
    return null;

  if (typeof d.acionavel !== "boolean") return null;
  if (typeof d.rotuloPt !== "string") return null;
  if (!ehTextoOuNulo(d.mensagemRecusaPt)) return null;
  if (typeof d.versaoRegra !== "string") return null;
  if (typeof d.despachadoEm !== "string") return null;

  const bundle = lerBundle(d.bundle);
  if (bundle === null) return null;

  const acionavel = derivarAcionavel(bundle, modo);
  // Divergência ⇒ o valor armazenado não é confiável. `null` (não acionável)
  // é a leitura honesta; publicar o valor "corrigido" apagaria a evidência de
  // que a linha estava adulterada.
  if (acionavel !== d.acionavel) return null;

  return Object.freeze({
    desfecho,
    modo,
    acionavel,
    rotuloPt: d.rotuloPt,
    motivoRecusa: (motivoRecusa ?? null) as MotivoRecusa | null,
    mensagemRecusaPt: d.mensagemRecusaPt,
    versaoRegra: d.versaoRegra,
    despachadoEm: d.despachadoEm,
    bundle,
  });
}

/**
 * Extrai o envelope de um `result` de `evaluation_record` lido do banco.
 * Açúcar sobre `lerModoDeDespacho`, para o caminho de leitura da grade de
 * leitos, onde só o `result` cru está em mãos.
 */
export function modoDeDespachoDoResultadoPersistido(
  result: Record<string, unknown> | null | undefined,
): ModoDeDespachoAvaliacao | null {
  if (result === null || result === undefined) return null;
  return lerModoDeDespacho(result.despacho);
}
