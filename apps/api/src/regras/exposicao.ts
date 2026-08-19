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
 * DE ONDE VEM `acionavel` — correção do ACH-REV8-3
 * ------------------------------------------------
 * A versão anterior deste arquivo afirmava que `acionavel` era seguro porque
 * "é RECALCULADO aqui por `ehAcionavel` a partir da proveniência exposta".
 * Essa afirmação estava ERRADA e foi refutada por reprodução: no caminho de
 * LEITURA, registro e proveniência vinham do MESMO blob persistido. Recalcular
 * um a partir do outro é checagem de COERÊNCIA entre campos que o atacante
 * controla — não de AUTORIDADE. Um registro internamente coerente
 * (`assinatura_verificada` + zero bloqueios + `modo: "acionavel"` +
 * `acionavel: true`) publicava `acionavel: true` em resposta HTTP real, com
 * rótulo pt-BR escolhido pelo atacante. Ver `./autoridade.test.ts`.
 *
 * Distinção que este módulo agora faz, e que antes não fazia:
 * - caminho de ESCRITA (`projetarModoDeDespacho`, `comModoDeDespacho`,
 *   `resultadoNews2Publicavel`): o registro acabou de ser produzido NESTE
 *   processo por `RegistroDeRegras.despachar`, que já consultou quadro de
 *   chaves e porta de bundle. A autoridade é a própria execução do despachante;
 * - caminho de LEITURA (`lerModoDeDespacho` e derivados): o registro veio do
 *   armazenamento e não prova nada sobre si. Serve de CHAVE DE JUNÇÃO e é
 *   conciliado com o `CatalogoDeAutoridade` do runtime. Sem autoridade que
 *   sustente a alegação, `acionavel` é `false` e alegações de cadeia
 *   verificada/modo acionável são recusadas — fail-closed por AUSÊNCIA DE
 *   AUTORIDADE.
 *
 * O QUE ESTE MÓDULO NÃO FAZ — e não pode fazer
 * --------------------------------------------
 * 1. NÃO promove nada a acionável. Estado factual preservado: 0 vias clínicas
 *    acionáveis; 47/47 inelegíveis; ADR-0007 C5 ABERTA (sem custódia de chave
 *    não há artefato com cadeia verificada, logo `ehAcionavel` não tem como
 *    ser verdadeiro para artefato real).
 * 2. NÃO altera semântica clínica, limiar, janela, banda ou vetor. Nenhum
 *    número clínico é lido, escrito ou derivado aqui.
 * 3. NÃO publica PHI nem identificador de sujeito. Ver
 *    `CAMPOS_RETIDOS_DO_REGISTRO`: `correlacaoId`, `entradas` (total +
 *    digest) e `razoes` ficam RETIDOS no registro durável do outbox, que é
 *    trilha de auditoria interna, e não viajam na resposta.
 * 4. NÃO valida o VALOR de escore, banda, status, motivos, anotações ou
 *    explicação de um `result` persistido — é o achado **`ACH-O3-1`, ABERTO**.
 *    Desde a correção do ACHADO 1 (abaixo) a projeção é uma ALLOW-LIST de
 *    campos conhecidos, o que fecha a injeção ESTRUTURAL; o conteúdo de cada
 *    campo conhecido continua vindo do blob VERBATIM, e é isso que segue
 *    aberto.
 *
 *    ALCANCE MEDIDO do `ACH-O3-1` — o texto anterior o subdimensionava. Ele
 *    dizia "fabrica UM ESCORE, só não fabrica uma RECOMENDAÇÃO ACIONÁVEL".
 *    Reproduzido em `./autoridade.test.ts` (secção 5), quem escreve uma linha
 *    em `evaluation_records` também:
 *    - OCULTA DETERIORAÇÃO: o veredito real do kernel (11/`critico` para a
 *      série semeada) é publicado como 0/`normal` com `status: "valido"` —
 *      isto é, sem nenhuma degradação de status que sinalize o problema. Não é
 *      "um escore a mais"; é o escore CERTO substituído pelo escore ERRADO na
 *      direção clinicamente perigosa;
 *    - ESCREVE PROSA EM pt-BR NA TELA DO INTENSIVISTA: `explicacao`,
 *      `anotacoes` e `motivos` são RENDERIZADOS
 *      (`apps/web/src/components/DetalhePaciente.tsx`, `ExplicacaoDoBackend` —
 *      `<p>{avaliacao.explicacao}</p>`, lista de `anotacoes`, `motivos` em
 *      `<code>`). Texto normativo do atacante em superfície clínica (HAZ-0005).
 *
 *    LIMITE DO QUE FOI MEDIDO AQUI: a grade de leitos toma `escore`, `banda` e
 *    `statusAvaliacao` das COLUNAS de `evaluation_records`, não do blob
 *    `result` — forjar só o blob NÃO move a grade (asserido em
 *    `./autoridade.test.ts`). A substituição do ITEM DE TRABALHO (alerta da
 *    grade e `POST /v1/alertas/{id}/reconhecer`) relatada por revisão
 *    adversarial é de outra tabela (`work_items`) e NÃO foi reproduzida por
 *    este módulo — não está afirmada aqui.
 *
 *    Fechá-lo exige integridade do registro persistido (assinatura de linha,
 *    HMAC ou coluna de digest) — desenho novo, que toca
 *    `packages/persistencia` e provavelmente a mesma custódia de chave da
 *    ADR-0007 C5. Coberto por asserção em `./autoridade.test.ts`, para que o
 *    limite seja visível e falhe alto se alguém o alterar em silêncio.
 *
 * Rastreio: ACH-REV8-3 (fechado), ACH-O3-1 (ABERTO), ADR-0007 (formato/
 * assinatura/aprovação/ativação/rollback, C5 aberta), ADR-0008 §8.3 (recusa
 * nunca é no-fire silencioso), ADR-0020 O5 (o aviso de degradação atravessa a
 * fronteira), QAS-0023, HAZ-0005, LAC-L2.
 */
import type {
  ModoDeDespachoAvaliacao,
  ProvenienciaBundlePublicada,
  ResultadoAvaliacao,
} from "@intensicare/contratos";
import { resultadoNaoAvaliadoNews2, type SaidaNews2 } from "./news2.js";
import type { AutoridadeDeRegra, CatalogoDeAutoridade, Despacho } from "./registro.js";
import {
  type EstadoAssinatura,
  ehAcionavel,
  MOTIVO_RECUSA_PT,
  type ModoDespacho,
  type MotivoRecusa,
  type ProvenienciaBundle,
  type RegistroDeAvaliacao,
  ROTULO_NAO_AVALIADO_PT,
  ROTULO_SOMBRA_PT,
} from "./tipos.js";

// ---------------------------------------------------------------------------
// Forma exposta — UMA definição só, a do contrato
// ---------------------------------------------------------------------------
//
// `ProvenienciaBundleExposta` e `ModoDeDespachoAvaliacao` eram declarados
// AQUI, estruturalmente idênticos aos de `@intensicare/contratos`. O gate de
// deriva (`scripts/check_contratos.mjs`, seção F2) confronta os ENUMS, não a
// FORMA das interfaces: um campo acrescentado de um lado só passaria
// despercebido. Fechado por import — a forma que atravessa a fronteira HTTP
// é a do contrato, e não há segunda declaração para divergir dela.
//
// As duas formas foram conferidas campo a campo antes da troca e coincidiam
// exatamente; nenhum campo foi acrescentado, removido ou renomeado.

/**
 * Proveniência PUBLICÁVEL do artefato de regra que governou o despacho.
 * Alias local do tipo do contrato, mantido porque é o nome usado no restante
 * deste módulo e por seus consumidores.
 *
 * É `ProvenienciaBundle` (interno) MENOS `autorKeyId` e `aprovadorKeyId`:
 * identificador de chave é material de custódia (ADR-0007 eixos 2 e 3) e não
 * é necessário para representar a degradação.
 */
export type ProvenienciaBundleExposta = ProvenienciaBundlePublicada;

export type { ModoDeDespachoAvaliacao };

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
 * Aplica a regra de acionabilidade de `./tipos.js` a uma proveniência já na
 * forma EXPOSTA — uma única definição da regra, não duas.
 * `autorKeyId`/`aprovadorKeyId` entram como `null` porque `ehAcionavel` não os
 * lê (ele exige `assinatura_verificada`, que já é consequência de a cadeia
 * autor≠aprovador ter sido verificada no `rule-bundle`).
 *
 * ATENÇÃO (ACH-REV8-3): esta função responde "esta proveniência é acionável?",
 * e NÃO "esta proveniência é autêntica?". Aplicá-la a uma proveniência lida do
 * armazenamento é checagem de coerência, não de autoridade — foi exatamente
 * esse o defeito. No caminho de leitura ela só pode ser aplicada à proveniência
 * vinda do `CatalogoDeAutoridade`.
 */
export function derivarAcionavel(
  bundle: ProvenienciaBundleExposta,
  modo: ModoDespacho | null,
): boolean {
  return ehAcionavel({ ...bundle, autorKeyId: null, aprovadorKeyId: null }, modo);
}

/** Projeta uma proveniência INTERNA na forma publicável (sem material de chave). */
function exporProveniencia(bundle: ProvenienciaBundle): ProvenienciaBundleExposta {
  return Object.freeze({
    versaoBundle: bundle.versaoBundle,
    digestManifesto: bundle.digestManifesto,
    behaviorHash: bundle.behaviorHash,
    assinatura: bundle.assinatura,
    bloqueiosDeAtivacao: Object.freeze([...bundle.bloqueiosDeAtivacao]),
    ativoDesde: bundle.ativoDesde,
  });
}

/**
 * Projeta o registro imutável na forma publicável.
 *
 * AUTORIDADE DESTE CAMINHO (contraste deliberado com o de leitura): aqui o
 * `registro` acabou de ser produzido, NESTE processo, por
 * `RegistroDeRegras.despachar` — que já consultou o quadro de chaves e a
 * porta de bundle. A autoridade é a própria execução do despachante, e por
 * isso a derivação sobre os campos do registro é legítima aqui e NÃO é no
 * caminho de leitura, onde o registro veio do armazenamento (ACH-REV8-3).
 *
 * Lança `DespachoIncoerenteError` quando o registro declara `acionavel`
 * divergente da derivação — no caminho real isso é impossível, logo só pode
 * significar registro fabricado passado a esta função por outra via.
 */
export function projetarModoDeDespacho(registro: RegistroDeAvaliacao): ModoDeDespachoAvaliacao {
  const bundle = exporProveniencia(registro.bundle);

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

/**
 * Código de bloqueio que marca uma leitura SEM autoridade (ACHADO 4).
 *
 * Não é um bloqueio do manifesto — é a representação explícita de "este
 * runtime não tem como atestar artefato nenhum para esta linha". Existe para
 * que `bloqueiosDeAtivacao: []` NUNCA seja publicado nessa condição: lista
 * vazia lê-se, na tela, como "nenhum impedimento", que é o oposto do que
 * ocorreu. Mesma disciplina de `BLOQUEIO_ASSINATURA_AUSENTE` (`./bundle.ts`),
 * que já representa um estado que o vocabulário do `rule-bundle` não tem.
 * Não é vocabulário clínico e não altera regra, limiar ou banda.
 */
export const BLOQUEIO_PROVENIENCIA_NAO_ATESTADA =
  "proveniencia_nao_atestada_leitura_sem_autoridade";

/**
 * Proveniência publicada quando NÃO há autoridade para atestar coisa alguma
 * (ACHADO 4 — "sem autoridade não há proveniência publicável").
 *
 * O ramo sem autoridade publicava `versaoBundle`/`digestManifesto`/
 * `behaviorHash`/`ativoDesde`/`bloqueiosDeAtivacao` LIDOS DO BLOB, ou seja,
 * metadados de um artefato que este runtime pode nunca ter carregado —
 * reproduzido: `{"versaoBundle":"9.9.9",…,"bloqueiosDeAtivacao":[],
 * "ativoDesde":"2099-01-01T00:00:00.000Z"}`. Descrever um artefato é uma
 * alegação de conhecimento; sem catálogo, este serviço não a tem.
 *
 * Nenhum campo aqui vem do chamador. `assinatura: "sem_bundle"` já basta para
 * `ehAcionavel` ser falso, e o bloqueio explícito impede a leitura "sem
 * impedimentos".
 */
export const PROVENIENCIA_NAO_ATESTADA: ProvenienciaBundleExposta = Object.freeze({
  versaoBundle: null,
  digestManifesto: null,
  behaviorHash: null,
  assinatura: "sem_bundle" as const,
  bloqueiosDeAtivacao: Object.freeze([BLOQUEIO_PROVENIENCIA_NAO_ATESTADA]) as readonly string[],
  ativoDesde: null,
});

/**
 * Rótulo pt-BR VISÍVEL, DERIVADO do desfecho (ACHADO 3).
 *
 * Antes vinha do blob, nos dois ramos. Como a chave de junção é inteiramente
 * pública (sai em toda resposta legítima), copiá-la é trivial — e uma vez
 * copiada o registro era aceito e o texto visível saía como o atacante o
 * escreveu. Medido: `rotuloPt: "ACIONÁVEL — conduta clínica autorizada.
 * Iniciar noradrenalina 0,1 mcg/kg/min."` publicado ao lado de
 * `acionavel: false`.
 *
 * O rótulo não acrescenta informação: é função do desfecho e é CONSTANTE
 * deste serviço. Estas são exatamente as constantes que `registro.ts` grava
 * no caminho de escrita (`ROTULO_SOMBRA_PT` para "avaliada",
 * `ROTULO_NAO_AVALIADO_PT` para "nao_avaliada"). Nenhum texto clínico novo é
 * redigido aqui.
 */
function rotuloDerivado(desfecho: "avaliada" | "nao_avaliada"): string {
  return desfecho === "avaliada" ? ROTULO_SOMBRA_PT : ROTULO_NAO_AVALIADO_PT;
}

/**
 * Mensagem pt-BR VISÍVEL da recusa, DERIVADA do motivo (ACHADO 3). Mesma
 * tabela `MOTIVO_RECUSA_PT` que o caminho de escrita usa; o vocabulário de
 * motivos é FECHADO e já foi validado antes desta chamada.
 *
 * DIFERENÇA CONHECIDA: `registro.ts` pode gravar, no lugar do texto canônico,
 * o `mensagemUi` do quadro de chaves quando a recusa vem do kill switch de
 * runtime. Na leitura publica-se o texto canônico do MESMO motivo — texto
 * deste serviço, do mesmo vocabulário fechado, na mesma direção (a recusa
 * continua visível e nomeada). É perda de especificidade, não de aviso.
 */
function mensagemDerivada(
  desfecho: "avaliada" | "nao_avaliada",
  motivoRecusa: MotivoRecusa | null,
): string | null {
  if (desfecho === "avaliada" || motivoRecusa === null) return null;
  return MOTIVO_RECUSA_PT[motivoRecusa];
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
 * Autoridade consultada na LEITURA: o catálogo do runtime mais o instante em
 * que ele deve ser interrogado. O instante entra por parâmetro — sem relógio
 * interno, mesma disciplina do kernel, do livro-razão e das portas.
 */
export interface AutoridadeDeLeitura {
  readonly catalogo: CatalogoDeAutoridade;
  readonly instanteIso: string;
}

/**
 * Confronta o que o registro persistido ALEGA com o que a autoridade do
 * runtime SABE. O registro é apenas CHAVE DE JUNÇÃO: identifica o artefato,
 * não o descreve.
 *
 * `null` ⇒ a alegação não corresponde a nenhum artefato que este runtime
 * carregou; nada daquele registro é publicável (fail-closed por AUSÊNCIA DE
 * AUTORIDADE — não por incoerência, que é o que o atacante controla).
 */
function conciliarComAutoridade(
  chaveRegra: string,
  bundleAlegado: ProvenienciaBundleExposta,
  modoAlegado: ModoDespacho | null,
  autoridade: AutoridadeDeLeitura,
): AutoridadeDeRegra | null {
  const entrada = autoridade.catalogo.autoridadeDe(chaveRegra, autoridade.instanteIso);
  if (entrada === null) return null;

  // Chave de junção: identidade do ARTEFATO, não seus atributos de confiança.
  // `assinatura` e `bloqueiosDeAtivacao` são deliberadamente EXCLUÍDOS daqui —
  // é exatamente o que o atacante forja, e é a autoridade que os fornece.
  if (bundleAlegado.versaoBundle !== entrada.proveniencia.versaoBundle) return null;
  if (bundleAlegado.behaviorHash !== entrada.proveniencia.behaviorHash) return null;
  if (bundleAlegado.digestManifesto !== entrada.proveniencia.digestManifesto) return null;
  if (modoAlegado !== entrada.modo) return null;

  return entrada;
}

/**
 * Lê o envelope de modo de despacho de um `ResultadoAvaliacao` já
 * PERSISTIDO, fail-closed.
 *
 * COMO `acionavel` É OBTIDO (ACH-REV8-3 — leia antes de mexer)
 * -----------------------------------------------------------
 * Ele NÃO é copiado do registro, e também NÃO é derivado dos campos do
 * registro. A versão anterior fazia a segunda coisa e isso era uma checagem
 * de COERÊNCIA entre campos do mesmo blob: quem controlasse o blob
 * controlava os dois lados. Um registro internamente coerente
 * (`assinatura_verificada` + zero bloqueios + `modo: "acionavel"` +
 * `acionavel: true`) publicava acionabilidade sem autoridade alguma —
 * reproduzido contra o servidor real (ver `./autoridade.test.ts`).
 *
 * Agora:
 * - COM `autoridade`: o registro é conciliado por chave de junção com o
 *   artefato que o runtime carregou; `acionavel` é derivado da proveniência
 *   DA AUTORIDADE, e é ela que também é publicada.
 * - SEM `autoridade`: nada pode ser derivado. `acionavel` é `false`; e um
 *   registro que declara `true` é fabricado — devolve `null`, para não
 *   publicar uma versão "lavada" da linha forjada.
 *
 * Devolve `null` — que o contrato define como "modo de despacho não
 * registrado, trate como NÃO acionável" — para: campo ausente (linha gravada
 * antes desta versão), forma inválida, alegação sem autoridade que a
 * sustente, e chave de junção divergente. Nunca lança: uma linha ruim não
 * pode derrubar a leitura da grade inteira.
 */
export function lerModoDeDespacho(
  bruto: unknown,
  autoridade?: AutoridadeDeLeitura,
): ModoDeDespachoAvaliacao | null {
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
  // `rotuloPt`/`mensagemRecusaPt` continuam sendo exigidos como BEM FORMADOS
  // — um envelope gravado por este serviço sempre os tem —, mas NÃO são mais
  // publicados a partir do blob: são derivados abaixo (ACHADO 3).
  if (typeof d.rotuloPt !== "string") return null;
  if (!ehTextoOuNulo(d.mensagemRecusaPt)) return null;
  if (typeof d.versaoRegra !== "string") return null;
  if (typeof d.despachadoEm !== "string") return null;

  // Coerência ESTRUTURAL com o que `registro.ts` grava — não é juízo clínico
  // e não é a checagem de coerência refutada pelo ACH-REV8-3 (aquela decidia
  // ACIONABILIDADE): "avaliada" tem modo de ativação e não tem motivo de
  // recusa; "nao_avaliada" tem motivo e não tem modo. A combinação impossível
  // não é um envelope produzido por este serviço, e é ela que tornaria a
  // derivação de rótulo/mensagem ambígua.
  if (desfecho === "avaliada" && (modo === null || motivoRecusa !== null)) return null;
  if (desfecho === "nao_avaliada" && (modo !== null || motivoRecusa === null)) return null;

  const bundleAlegado = lerBundle(d.bundle);
  if (bundleAlegado === null) return null;

  let bundle: ProvenienciaBundleExposta;
  let acionavel: boolean;

  if (autoridade === undefined) {
    // Nenhuma autoridade em mãos ⇒ NADA que dependa de autoridade é
    // publicável. Não basta zerar `acionavel`: um registro que exibe
    // `assinatura_verificada` ou `modo: "acionavel"` sem quem o sustente é
    // lavagem de autoridade — a tela mostraria uma cadeia de assinatura que
    // ninguém verificou. Fail-closed nos três, e não só no booleano.
    //
    // As TRÊS guardas são independentes e cada uma tem, em
    // `./autoridade.test.ts`, um vetor que a mata sozinha — sem isso, duas
    // delas eram invisíveis à suíte inteira (medido por mutação: removê-las
    // deixava 387 testes verdes) porque TODO vetor carregava
    // `assinatura_verificada` e só a terceira decidia.
    if (d.acionavel) return null;
    if (modo === "acionavel") return null;
    if (bundleAlegado.assinatura === "assinatura_verificada") return null;
    // …e mesmo passando as três, a PROVENIÊNCIA do blob não é publicável:
    // descrever o artefato é alegar conhecê-lo, e sem catálogo este runtime
    // não o conhece (ACHADO 4). `versaoRegra` permanece porque é a CHAVE DE
    // JUNÇÃO, não proveniência — e a mesma string já é republicada verbatim
    // em `ResultadoAvaliacao.versaoRegra`, que segue sob o ACH-O3-1 (ABERTO);
    // suprimi-la só aqui seria teatro.
    bundle = PROVENIENCIA_NAO_ATESTADA;
    acionavel = false;
  } else {
    const entrada = conciliarComAutoridade(d.versaoRegra, bundleAlegado, modo, autoridade);
    if (entrada === null) return null;
    bundle = exporProveniencia(entrada.proveniencia);
    acionavel = ehAcionavel(entrada.proveniencia, entrada.modo);
    // Divergência entre o declarado e o que a AUTORIDADE deriva ⇒ a linha não
    // é confiável. `null` é a leitura honesta; publicar o valor "corrigido"
    // apagaria a evidência de que a linha estava adulterada.
    if (acionavel !== d.acionavel) return null;
  }

  const motivo = (motivoRecusa ?? null) as MotivoRecusa | null;
  return Object.freeze({
    desfecho,
    modo,
    acionavel,
    // DERIVADOS do desfecho/motivo, nunca copiados do blob (ACHADO 3).
    rotuloPt: rotuloDerivado(desfecho),
    motivoRecusa: motivo,
    mensagemRecusaPt: mensagemDerivada(desfecho, motivo),
    versaoRegra: d.versaoRegra,
    despachadoEm: d.despachadoEm,
    bundle,
  });
}

// ---------------------------------------------------------------------------
// ALLOW-LIST da projeção do `result` persistido (ACHADO 1)
// ---------------------------------------------------------------------------

/**
 * Formas ESTRUTURAIS aceitas. São tipos de dado, não vocabulário clínico: aqui
 * não se decide se `banda` é `"critico"` ou se `status` é `"valido"` — isso é
 * taxonomia clínica e não é decidível por este serviço (e o VALOR segue sob o
 * ACH-O3-1, ABERTO). Decide-se apenas se o campo tem a forma que o contrato
 * declara.
 */
type FormaDeCampo =
  | "texto"
  | "numero"
  | "booleano"
  | "textoOuNulo"
  | "numeroOuNulo"
  | "listaDeTexto"
  | "listaDeContribuicoes";

/**
 * Campos de `ContribuicaoParametro` (`@intensicare/contratos`) e sua forma.
 * Existe como DADO, e não como comentário, para que um teste possa confrontá-la
 * com as chaves de uma contribuição REAL produzida pelo kernel — campo novo no
 * contrato reprova o teste em vez de sumir em silêncio da superfície.
 */
export const FORMA_DOS_CAMPOS_DA_CONTRIBUICAO: Readonly<Record<string, FormaDeCampo>> =
  Object.freeze({
    parametro: "texto",
    presente: "booleano",
    valor: "numero",
    unidade: "texto",
    codigo: "texto",
    pontos: "numero",
    statusParametro: "texto",
    motivo: "textoOuNulo",
    coletadoEm: "textoOuNulo",
    explicacao: "texto",
  });

/**
 * Campos de `ResultadoAvaliacao` e sua forma — a ALLOW-LIST da projeção.
 * `despacho` NÃO está aqui de propósito: ele não é copiado, é reconstruído sob
 * autoridade por `lerModoDeDespacho`.
 */
export const FORMA_DOS_CAMPOS_DO_RESULTADO: Readonly<Record<string, FormaDeCampo>> = Object.freeze({
  status: "texto",
  parametrosAusentes: "listaDeTexto",
  parametros: "listaDeContribuicoes",
  escore: "numeroOuNulo",
  banda: "textoOuNulo",
  avaliadoEm: "texto",
  motivos: "listaDeTexto",
  anotacoes: "listaDeTexto",
  explicacao: "texto",
  parametroVermelho: "booleano",
  versaoRegra: "texto",
});

function listaDeTexto(v: unknown): readonly string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  // Tudo-ou-nada, mesma disciplina de `lerBundle`: um elemento fora da forma
  // torna a lista inteira não publicável. Descartar elementos em silêncio
  // esconderia a adulteração; publicar um objeto dentro de uma lista de texto
  // reabriria a injeção estrutural que esta allow-list existe para fechar.
  if (!v.every((x): x is string => typeof x === "string")) return undefined;
  return Object.freeze([...v]);
}

/**
 * Projeta um objeto bruto pela tabela de formas. Chave desconhecida é
 * DESCARTADA; chave conhecida com forma inválida é OMITIDA (nunca substituída
 * por um valor inventado — inventar aqui seria fabricar dado clínico).
 */
function projetarPorForma(
  bruto: Record<string, unknown>,
  formas: Readonly<Record<string, FormaDeCampo>>,
): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const [campo, forma] of Object.entries(formas)) {
    if (!Object.hasOwn(bruto, campo)) continue;
    const v = bruto[campo];
    switch (forma) {
      case "texto":
        if (typeof v === "string") saida[campo] = v;
        break;
      case "numero":
        if (typeof v === "number") saida[campo] = v;
        break;
      case "booleano":
        if (typeof v === "boolean") saida[campo] = v;
        break;
      case "textoOuNulo":
        if (ehTextoOuNulo(v)) saida[campo] = v;
        break;
      case "numeroOuNulo":
        if (v === null || typeof v === "number") saida[campo] = v;
        break;
      case "listaDeTexto": {
        const lista = listaDeTexto(v);
        if (lista !== undefined) saida[campo] = lista;
        break;
      }
      case "listaDeContribuicoes": {
        if (!Array.isArray(v)) break;
        if (!v.every((x) => typeof x === "object" && x !== null && !Array.isArray(x))) break;
        saida[campo] = Object.freeze(
          v.map((x) =>
            Object.freeze(
              projetarPorForma(x as Record<string, unknown>, FORMA_DOS_CAMPOS_DA_CONTRIBUICAO),
            ),
          ),
        );
        break;
      }
    }
  }
  return saida;
}

/**
 * Extrai o envelope de um `result` de `evaluation_record` lido do banco.
 * Açúcar sobre `lerModoDeDespacho`, para o caminho de leitura da grade de
 * leitos, onde só o `result` cru está em mãos.
 */
export function modoDeDespachoDoResultadoPersistido(
  result: Record<string, unknown> | null | undefined,
  autoridade?: AutoridadeDeLeitura,
): ModoDeDespachoAvaliacao | null {
  if (result === null || result === undefined) return null;
  return lerModoDeDespacho(result.despacho, autoridade);
}

/**
 * Reemite um `result` de `evaluation_record` como `ResultadoAvaliacao`
 * publicável, com o envelope de despacho SUBMETIDO À AUTORIDADE.
 *
 * POR QUE EXISTE. A rota `GET /v1/pacientes/{ref}/avaliacoes` devolvia
 * `row.result` por conversão de tipo direta, sem passar por este módulo: o
 * blob persistido atravessava a fronteira HTTP verbatim, incluindo `despacho`.
 * Reproduzido: uma linha forjada publicava `acionavel: true` e um `rotuloPt`
 * escolhido pelo atacante (ACH-REV8-3, vetor A). Esta função é o ponto por
 * onde aquele caminho passou a ser fail-closed, e já está fiada em
 * `apps/api/src/db.ts` (`getPatientEvaluations`).
 *
 * O QUE MUDOU — ACHADO 1 (P0 na origem). A versão anterior fazia
 * `{ ...(result as ResultadoAvaliacao), despacho }`: SÓ a chave `despacho` era
 * substituída e QUALQUER outra chave do blob passava. Reproduzido antes desta
 * edição, com a carga no TOPO do `result` em vez de dentro de `despacho`:
 *
 *   SONDA/TOPO texto => {"escore":0,…,"acionavel":true,
 *     "rotuloPt":"ACIONÁVEL — conduta clínica autorizada.","despacho":null}
 *   SONDA/DESCONHECIDO => {"escore":0,"campoQueNaoExisteNoContrato":"SYNTH-CARGA",…}
 *
 * Ou seja: a tripwire `not.toContain('"acionavel":true")` de
 * `./autoridade.test.ts` passava por ACIDENTE DA FORMA DE FORJA escolhida
 * (tudo dentro de `despacho`), não por propriedade do código. A projeção agora
 * é ALLOW-LIST: só campos conhecidos, e cada um só quando tem a FORMA
 * declarada no contrato. Campo desconhecido não passa; campo conhecido com
 * forma inválida é OMITIDO (nunca fabricado). A allow-list é aplicada também
 * dentro de `parametros[]`, porque "no topo" não é a única posição possível.
 *
 * O QUE ELA CONTINUA NÃO FAZENDO — `ACH-O3-1`, ABERTO. A allow-list é
 * ESTRUTURAL. O VALOR de `escore`, `banda`, `status`, `motivos`, `anotacoes` e
 * `explicacao` continua vindo do blob VERBATIM — o atacante que escreve no
 * banco segue ocultando deterioração e escrevendo prosa pt-BR na tela do
 * intensivista (ver alcance medido no cabeçalho deste arquivo). Não feche isso
 * aqui por conveniência: exige integridade do registro persistido, não
 * filtragem na projeção. Nenhum número clínico é lido, escrito ou derivado
 * aqui.
 */
export function resultadoPersistidoPublicavel(
  result: Record<string, unknown>,
  autoridade?: AutoridadeDeLeitura,
): ResultadoAvaliacao {
  const projetado = projetarPorForma(result, FORMA_DOS_CAMPOS_DO_RESULTADO);
  // `despacho` é o único campo cujo VALOR é reconstruído, e não copiado: ele é
  // submetido à autoridade do runtime (ACH-REV8-3). Entra por último, e por
  // atribuição direta, para que nenhuma chave `despacho` do blob o alcance.
  projetado.despacho = lerModoDeDespacho(result.despacho, autoridade);
  // A conversão é honesta sobre o que a função pode e não pode prometer: a
  // FORMA é a do contrato (allow-list acima), o CONTEÚDO não é verificável
  // sem integridade do registro persistido (ACH-O3-1, ABERTO). Um campo
  // obrigatório ausente ou malformado no blob sai AUSENTE, jamais inventado.
  return Object.freeze(projetado) as unknown as ResultadoAvaliacao;
}
