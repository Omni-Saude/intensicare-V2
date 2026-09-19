/**
 * apps/api/src/db.ts — fiação REAL da fatia (integração SPR-G7-2).
 *
 * Substitui o antigo `store.ts` em memória ("INTEGRAÇÃO PENDENTE",
 * removido): todo estado agora vive em `@intensicare/persistencia`
 * (PGlite — classe PostgreSQL, PRE-03) sob RLS por tenant, com outbox
 * transacional (ADR-0010 B1: efeito + evento na MESMA transação),
 * auditoria append-only (ADR-0009 W6) em toda leitura/ação e concorrência
 * otimista por versão (ADR-0009 Q2-A; HAZ-0023).
 *
 * PREMISSA (reversível, GDEC-0015/0017): a ingestão exige encontro/leito
 * previamente provisionados (fixtures sintéticas) — provisionamento
 * ADT/censo é matéria de fatia futura; envelope para encontro inexistente
 * (ou de outro tenant) responde 404 sem distinguir os dois casos.
 *
 * PREMISSA (reversível, GDEC-0015/0017): nesta fatia o `WorkItem` nasce
 * 1:1 com o seu `Alert` e carrega o MESMO id — o contrato expõe um único
 * identificador de alerta acionável.
 */
import { createHash, randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import type {
  BandaRisco,
  ContextoAvaliacaoPaciente,
  EntradaGradeLeitos,
  EstadoItemTrabalho,
  EventoFluxo,
  Frescor,
  IngestaoObservacoesResposta,
  ItemTrabalho,
  ObservacaoEmQuarentena,
  ObservacaoEntrada,
  ResultadoAvaliacao,
  ResumoItemTrabalho,
  StatusAvaliacao,
} from "@intensicare/contratos";
import {
  absentInstant,
  deveriaEmitirAlerta,
  isLegalWorkItemTransition,
  presentInstant,
  type TemporalValue,
  WORK_ITEM_STATES,
  type WorkItemState,
} from "@intensicare/dominio";
import { loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import { type EvaluationRecord, reassessNews2AtReadTime } from "@intensicare/kernel-clinico";
import {
  type ActiveEncounterRow,
  AdaptadorPglite,
  AdaptadorPostgres,
  bootstrapDatabase,
  createInMemoryDatabase,
  getIdempotencyRecord,
  getWorkItem,
  insertAlert,
  insertAuditEvent,
  insertClinicalObservationWithOutbox,
  insertEvaluationRecord,
  insertIdempotencyRecord,
  insertOutboxEvent,
  insertSourceEnvelope,
  insertWorkItem,
  listActiveEncounters,
  listBeds,
  listClinicalObservationsForEncounter,
  listEvaluationRecordsBySubject,
  listLatestEvaluationPerEncounter,
  listOutboxEvents,
  listWorkItemsWithAlerts,
  type PortaBancoDeDados,
  transitionWorkItem,
  urlCom,
  type WorkItemWithAlertRow,
  withTenantTransaction,
} from "@intensicare/persistencia";
import {
  canonicalUnitFor,
  chaveDeDedupNews2,
  estadoAnteriorDeAvaliacao,
  PARAM_TO_CONCEPT,
  PARAM_TO_KERNEL,
  POLITICA_SUPRESSAO_NEWS2,
  requerAlerta,
} from "./avaliacao.js";
import type { ConfiguracaoRuntime } from "./config/index.js";
import {
  type AutoridadeDeLeitura,
  type ComModoDeDespacho,
  despacharNews2,
  modoDeDespachoDoResultadoPersistido,
  type RegistroDeRegras,
  resultadoNews2Publicavel,
  resultadoPersistidoPublicavel,
} from "./regras/index.js";

// Limiares de frescor ilustrativos — VALIDATION REQUIRED no ADR-0011 §3
// (nenhum alvo numérico de latência/frescor foi decidido). Existem apenas
// para tornar `Frescor` observável e testável nesta fatia.
const FRESCOR_ATUAL_MS = 5 * 60 * 1000;
const FRESCOR_ENVELHECENDO_MS = 30 * 60 * 1000;

/**
 * Autoridade de leitura para o catálogo de regras — construída
 * DEFENSIVAMENTE (ACH-REV8-3). `registroDeRegras` é OBRIGATÓRIO no tipo de
 * `projectBedGrid`/`getPatientEvaluations`, mas um caminho de chamada direto
 * a estas funções — fora de `routes.ts`, portanto fora da fronteira de
 * escrita desta correção — pode não ter migrado ainda e entregar
 * `undefined` em tempo de execução (TypeScript apaga tipos; um chamador não
 * checado por `tsc` não é impedido de omitir o campo). Preferimos DEGRADAR
 * para "nenhuma autoridade em mãos" — o MESMO ramo fail-closed que
 * `lerModoDeDespacho`/`modoDeDespachoDoResultadoPersistido` já aplicam
 * quando o parâmetro `autoridade` está ausente (ver `regras/exposicao.ts`) —
 * a um erro 500 opaco por acessar propriedade de `undefined`. Isto não
 * afrouxa nada: o resultado é o mesmo "sem autoridade ⇒ nada acionável" que
 * o caminho normal já produz sem `registroDeRegras` nenhum.
 */
function autoridadeDeLeituraOuIndisponivel(
  registroDeRegras: RegistroDeRegras,
  instanteIso: string,
): AutoridadeDeLeitura | undefined {
  const catalogo: RegistroDeRegras | undefined = registroDeRegras;
  return catalogo === undefined ? undefined : { catalogo, instanteIso };
}

/**
 * Abre o banco do processo e devolve a PORTA (`PortaBancoDeDados`) — nunca um
 * `PGlite` cru. Qual adaptador é aberto é decidido pela CONFIGURAÇÃO validada
 * (`apps/api/src/config/`), jamais por omissão:
 *
 *   - `existing` fornecido (teste E2E com semeadura própria) ⇒ simulador
 *     embrulhado em `AdaptadorPglite`, e SÓ em perfil sintético;
 *   - `banco.modo === "postgres"` ⇒ `AdaptadorPostgres.abrir(...)` com a URL do
 *     papel de APLICAÇÃO montada a partir de `IC_BANCO_URL`/`IC_BANCO_USUARIO`/
 *     `IC_BANCO_SENHA` (a URL de configuração não carrega credencial — ver
 *     `config/carregar.ts`). O adaptador RECUSA identidade superusuário,
 *     `BYPASSRLS` ou dona de tabela: URL errada ⇒ a API não sobe. É intencional
 *     (ADR-0016 §4.1; anti-padrão 5 do contrato de agentes). Fora de perfil
 *     sintético, o adaptador também EXIGE o FECHO DE RUNTIME da migração
 *     `0006_ancora_isolada.sql` (`exigirFechoDeRuntime`): sem ele, a recusa de
 *     identidade de `abrir()` é só um retrato do instante do boot, e um
 *     `GRANT`/`ALTER TABLE ... INHERIT`/`CREATE FUNCTION ... SECURITY DEFINER`
 *     aplicado por superusuário DEPOIS não é reavaliado até o próximo deploy
 *     (F1/F2 — cabeçalho de `@intensicare/persistencia/postgres/pool.ts`);
 *   - caso contrário ⇒ PGlite em memória, migrado, e semeado com as fixtures
 *     sintéticas SOMENTE quando `banco.semearFixturesSinteticas` (GDEC-0014;
 *     anti-padrão 9 — fixtures nunca em perfil não-dev).
 *
 * Defesa em profundidade: em perfil não sintético a porta devolvida precisa
 * declarar-se `postgres` COM fronteira de isolamento verificável. O simulador
 * declara `fronteiraDeIsolamentoVerificavel: false` no próprio objeto, e é essa
 * declaração — não a intenção de quem configurou — que decide (ACHADO-01,
 * THR-0050 P0; anti-padrão 6: RLS sob PGlite não se generaliza).
 */
export async function prepareDatabase(
  config: ConfiguracaoRuntime,
  existing?: PGlite,
): Promise<PortaBancoDeDados> {
  const sintetico = config.classePerfil === "sintetico";

  if (existing !== undefined) {
    if (!sintetico) {
      throw new Error(
        `banco injetado (simulador PGlite) recusado no perfil "${config.perfil}": ` +
          "o simulador não é fronteira de isolamento verificável e só é admissível " +
          "em perfil sintético (anti-padrão 9; ADR-0016 §4.1).",
      );
    }
    return new AdaptadorPglite(existing);
  }

  if (config.banco.modo === "postgres") {
    const { url, usuario, senha } = config.banco;
    if (url === null || usuario === null || senha === null) {
      // Inalcançável com configuração validada (`carregar.ts` já exige as três
      // em modo `postgres`); a guarda existe para que um caminho futuro que as
      // torne opcionais falhe aqui, e não numa consulta clínica.
      throw new Error(
        'banco em modo "postgres" sem URL, usuário ou senha do papel de aplicação — ' +
          "configuração incompleta recusa o boot em vez de degradar.",
      );
    }
    const porta = await AdaptadorPostgres.abrir({
      url: urlCom(url, { usuario, senha: senha.revelar() }),
      tamanhoMaximo: 8,
      // `!sintetico` é a MESMA distinção typada que `exigirFronteiraVerificavel`
      // (abaixo) já usa para exigir fronteira de isolamento verificável — não é
      // uma decisão nova de topologia, é o mesmo limite reaplicado ao fecho de
      // runtime. Em perfil sintético apontado para PostgreSQL (uso local/CI,
      // sem alegação de fronteira verificável: `exigirFronteiraVerificavel`
      // retorna cedo para essa classe) não exigimos — instalar o fecho requer
      // superusuário no PROVISIONAMENTO, e qual ambiente concede isso é
      // decisão de TOPOLOGIA, fora do escopo deste arquivo (contrato de
      // agentes §3).
      exigirFechoDeRuntime: !sintetico,
    });
    exigirFronteiraVerificavel(config, porta);
    return porta;
  }

  if (!sintetico) {
    throw new Error(
      `PGlite em memória recusado no perfil "${config.perfil}": ` +
        "modo de banco sintético só é admissível em perfil sintético (anti-padrão 9).",
    );
  }
  const db = createInMemoryDatabase();
  await bootstrapDatabase(db);
  if (config.banco.semearFixturesSinteticas) {
    await loadIntoDatabase(db);
  }
  const porta = new AdaptadorPglite(db);
  exigirFronteiraVerificavel(config, porta);
  return porta;
}

/** Ver `prepareDatabase`: o rótulo do adaptador é lido do objeto, não suposto. */
function exigirFronteiraVerificavel(config: ConfiguracaoRuntime, porta: PortaBancoDeDados): void {
  if (config.classePerfil === "sintetico") return;
  if (porta.rotulo !== "postgres" || !porta.fronteiraDeIsolamentoVerificavel) {
    throw new Error(
      `adaptador de banco "${porta.rotulo}" recusado no perfil "${config.perfil}": ` +
        "fora de perfil sintético a aplicação exige fronteira de isolamento verificável " +
        "(ADR-0016 §4.1; anti-padrão 6).",
    );
  }
}

// --- utilidades de tempo e identidade ---------------------------------------

function nowInstant(): TemporalValue {
  return presentInstant({ utc: new Date().toISOString(), offset: "+00:00", timezone: "Etc/UTC" });
}

/** Constrói o instante clínico preservando UTC normalizado, offset e valor-fonte (ADR-0005 M3). */
export function clinicalInstantFromIso(iso: string): TemporalValue {
  const utc = new Date(iso).toISOString();
  const match = /(Z|[+-]\d{2}:\d{2})$/.exec(iso);
  const offset = match === null || match[1] === "Z" ? "+00:00" : (match[1] as string);
  return presentInstant({ utc, offset, sourceValue: iso });
}

/** Hash SHA-256 (hex) do corpo canônico — base do replay idempotente com detecção de divergência. */
export function hashRequestBody(body: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(body) ?? "null")
    .digest("hex");
}

function hyphenState(state: string): EstadoItemTrabalho {
  return state.replaceAll("_", "-") as EstadoItemTrabalho;
}

function toIsoOrNull(instant: TemporalValue): string | null {
  return instant.kind === "present" ? instant.instant.utc : null;
}

function pgTimestampToIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

async function auditAction(
  tx: Parameters<typeof insertAuditEvent>[0],
  input: {
    tenantId: string;
    actorId: string;
    command: string;
    aggregateType: string;
    aggregateId: string;
    outcome: "sucesso" | "recusada";
    idempotencyKey: string;
  },
): Promise<void> {
  await insertAuditEvent(tx, {
    id: `SYNTH-AUDIT-${randomUUID()}`,
    tenantId: input.tenantId,
    actorId: input.actorId,
    command: input.command,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    newState: input.outcome,
    occurredAt: nowInstant(),
    idempotencyKey: input.idempotencyKey,
  });
}

// --- ingestão ---------------------------------------------------------------

export type IngestOutcome =
  | { readonly kind: "created"; readonly body: IngestaoObservacoesResposta }
  /**
   * Replay idempotente. O corpo é RECONSTRUÍDO por este processo
   * (`respostaDeReplayPublicavel`) — nunca o blob de `idempotency_records`
   * verbatim — e NÃO carrega `statusCode`: quem decide o código HTTP é o
   * contrato (201), não uma coluna que quem insere a linha escolhe
   * (ACH-O3-3).
   */
  | { readonly kind: "replayed"; readonly body: IngestaoObservacoesResposta }
  /**
   * Existe registro de idempotência para a chave, mas a resposta armazenada
   * NÃO reconstrói na forma do contrato. Fail-closed: nada é publicado, nem
   * uma versão "lavada" da linha. Ver `respostaDeReplayPublicavel`.
   */
  | { readonly kind: "replay-nao-publicavel" }
  | { readonly kind: "key-conflict" }
  | { readonly kind: "encounter-not-found" }
  | { readonly kind: "mismatch"; readonly detail: string };

export interface IngestArgs {
  readonly tenantId: string;
  readonly actorId: string;
  /**
   * Registro de regras clínicas versionadas. A avaliação NUNCA é chamada
   * diretamente: ela passa pelo despachante, que impõe as portas fail-closed
   * (artefato de regra disponível, motor reproduz o `behaviorHash` pinado,
   * quadro de chaves de runtime ligado) antes de deixar o kernel rodar
   * (ADR-0007; achado §6.4 P1).
   */
  readonly registroDeRegras: RegistroDeRegras;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly encontroId: string;
  readonly leitoId: string;
  readonly pacienteRef: string;
  readonly contexto: ContextoAvaliacaoPaciente | undefined;
  readonly aceitas: readonly ObservacaoEntrada[];
  readonly quarentena: readonly ObservacaoEmQuarentena[];
  readonly rawBody: unknown;
}

// --- replay idempotente: o corpo persistido NÃO atravessa verbatim ----------
//
// ACH-O3-3 (P0). O ramo de replay devolvia `existing.responseBody` e
// `existing.statusCode` lidos de `idempotency_records`, e `routes.ts` fazia
// `reply.code(resultado.statusCode).send(resultado.body)`. A migração
// `0002_g7_integration.sql:72` concede `insert` nessa tabela ao papel da
// APLICAÇÃO, e a guarda `existing.requestHash !== args.requestHash` não
// protege nada — quem insere a linha escolhe o `request_hash`. Reproduzido:
// uma linha plantada publicava `despacho.acionavel: true` com rótulo escolhido
// pelo atacante, sob um código HTTP também escolhido por ele.
//
// Esta era a TERCEIRA superfície de leitura do mesmo blob; as outras duas
// (`getPatientEvaluations`, `projectBedGrid`) já submetem o envelope de
// despacho ao catálogo de autoridade do runtime desde o fecho do ACH-REV8-3.
// Aqui a defesa é a MESMA função (`resultadoPersistidoPublicavel`) mais uma
// reconstrução: os campos que o PEDIDO desta requisição já determina não são
// lidos do armazenamento.

/**
 * Estados publicáveis de `ResumoItemTrabalho`, derivados da fonte ÚNICA
 * (`WORK_ITEM_STATES` de `@intensicare/dominio`) pela MESMA tradução que a
 * projeção de leitura usa (`hyphenState`). Reescrever os oito valores à mão
 * criaria uma segunda lista para divergir da primeira.
 */
const ESTADOS_ITEM_TRABALHO_PUBLICAVEIS: ReadonlySet<string> = new Set(
  WORK_ITEM_STATES.map(hyphenState),
);

function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Instante ISO 8601 normalizado, ou `null` quando o valor não é instante nenhum. */
function instanteIsoOuNulo(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const ms = Date.parse(valor);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Resumo de alerta lido do corpo armazenado, fail-closed por FORMA.
 *
 * Três resultados distintos, de propósito: `null` (o campo estava
 * explicitamente `null` — não houve alerta nesta ingestão), o resumo válido,
 * e `undefined` (forma inválida OU campo ausente ⇒ a resposta inteira não é
 * republicável). Campo ausente NÃO é tratado como "não houve alerta": o
 * caminho legítimo sempre grava a chave, com valor ou com `null`, e inferir
 * ausência de alerta a partir de ausência de campo esconderia um alerta.
 */
function resumoDeAlertaArmazenado(valor: unknown): ResumoItemTrabalho | null | undefined {
  if (valor === null) return null;
  if (!ehObjetoSimples(valor)) return undefined;
  if (typeof valor.id !== "string" || valor.id.length === 0) return undefined;
  if (typeof valor.estado !== "string" || !ESTADOS_ITEM_TRABALHO_PUBLICAVEIS.has(valor.estado)) {
    return undefined;
  }
  if (typeof valor.versao !== "number" || !Number.isInteger(valor.versao) || valor.versao < 0) {
    return undefined;
  }
  return { id: valor.id, estado: valor.estado as EstadoItemTrabalho, versao: valor.versao };
}

/**
 * Reconstrói a resposta de um replay idempotente. `null` ⇒ o corpo armazenado
 * não reconstrói e NADA é publicado (nem uma versão "lavada" dele).
 *
 * De onde vem cada campo, e por quê:
 *
 * - `encontroId`, `aceitas`, `quarentena` — do PEDIDO desta requisição, não do
 *   armazenamento. O `requestHash` já provou que o corpo recebido agora é o
 *   mesmo que produziu a resposta original, e a derivação de `aceitas`/
 *   `quarentena` (zod, em `routes.ts`) é pura: os valores são idênticos aos
 *   originais e vêm de uma fonte que o chamador autenticado controla para si
 *   mesmo, e não de uma linha que um terceiro pode ter plantado;
 * - `avaliacao` — MESMA submissão à autoridade que `getPatientEvaluations`
 *   faz: `resultadoPersistidoPublicavel` concilia `despacho` com o catálogo do
 *   runtime e devolve `null` quando nenhuma autoridade sustenta a alegação
 *   (`regras/exposicao.ts`). O ESCOPO deste fecho é ACIONABILIDADE: escore,
 *   banda, status, motivos e explicação continuam republicados verbatim —
 *   `ACH-O3-1`, ABERTO, exatamente como na rota de avaliações;
 * - `recebidoEm` — só existe no armazenamento (é o instante do processamento
 *   ORIGINAL; recalculá-lo agora seria mentir sobre quando o envelope foi
 *   processado). Validado como instante e normalizado. Residual declarado: um
 *   adversário com escrita no banco escolhe um instante válido — mesma classe
 *   do `ACH-O3-1`;
 * - `alerta` — validado por forma, pelo vocabulário FECHADO de estados do
 *   contrato E pela EXISTÊNCIA do item de trabalho neste tenant (`getWorkItem`,
 *   dentro desta mesma transação escopada). Um identificador de alerta que não
 *   corresponde a item nenhum é fabricação de estado de fluxo de trabalho, e
 *   não atravessa. `estado` e `versao` continuam vindo do corpo armazenado, e
 *   não da linha atual: replay idempotente devolve a resposta ORIGINAL, e
 *   trocá-los pelo estado corrente seria mudar essa semântica — decisão que
 *   este arquivo não toma (draft IETF idempotency-key-header). Residual
 *   declarado: dentro do tenant, um adversário com escrita no banco pode
 *   apontar para um item real com estado/versão de sua escolha — mesma classe
 *   do `ACH-O3-1`.
 */
async function respostaDeReplayPublicavel(
  tx: Parameters<typeof getWorkItem>[0],
  armazenado: Record<string, unknown>,
  args: IngestArgs,
  autoridade: AutoridadeDeLeitura | undefined,
): Promise<IngestaoObservacoesResposta | null> {
  // O tipo diz `Record<string, unknown>`, mas o valor vem de uma coluna
  // `jsonb` gravável: em runtime pode ser texto, número, arranjo ou `null`.
  // Guarda explícita — acessar propriedade de `null` viraria 500 opaco.
  if (!ehObjetoSimples(armazenado)) return null;

  const recebidoEm = instanteIsoOuNulo(armazenado.recebidoEm);
  if (recebidoEm === null) return null;

  const alerta = resumoDeAlertaArmazenado(armazenado.alerta);
  if (alerta === undefined) return null;
  if (alerta !== null && (await getWorkItem(tx, alerta.id)) === undefined) return null;

  const avaliacaoArmazenada = armazenado.avaliacao;
  if (!ehObjetoSimples(avaliacaoArmazenada)) return null;

  return {
    encontroId: args.encontroId,
    recebidoEm,
    aceitas: [...args.aceitas],
    quarentena: [...args.quarentena],
    avaliacao: resultadoPersistidoPublicavel(avaliacaoArmazenada, autoridade),
    alerta,
  };
}

/**
 * Fluxo real de ingestão, TODO dentro de UMA transação escopada por tenant:
 * idempotência (hash do corpo) → envelope de origem imutável → fato clínico
 * canônico + outbox por observação → avaliação NEWS2 REAL sobre as
 * observações persistidas do encontro → registro de avaliação imutável →
 * alerta durável + item de trabalho + outbox quando a avaliação válida
 * atinge condição de exibição → auditoria da ação. Falha em qualquer etapa
 * reverte TUDO — nunca efeito sem evento nem evento sem efeito (ADR-0010 B1).
 */
export async function ingestObservations(
  db: PortaBancoDeDados,
  args: IngestArgs,
): Promise<IngestOutcome> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    // Idempotência com hash do corpo (draft IETF idempotency-key-header).
    const existing = await getIdempotencyRecord(tx, args.idempotencyKey);
    if (existing !== undefined) {
      if (existing.requestHash !== args.requestHash) {
        await auditAction(tx, {
          tenantId: args.tenantId,
          actorId: args.actorId,
          command: "ingestao-observacoes",
          aggregateType: "encounter",
          aggregateId: args.encontroId,
          outcome: "recusada",
          idempotencyKey: args.idempotencyKey,
        });
        return { kind: "key-conflict" } as const;
      }
      // ACH-O3-3: reconstrói e submete à autoridade — ver
      // `respostaDeReplayPublicavel`. `existing.statusCode` é deliberadamente
      // IGNORADO: o `openapi.yaml` declara 201 para o replay, e ler o código
      // de uma coluna gravável deixava o atacante escolher também o status.
      const corpoDeReplay = await respostaDeReplayPublicavel(
        tx,
        existing.responseBody,
        args,
        autoridadeDeLeituraOuIndisponivel(args.registroDeRegras, new Date().toISOString()),
      );
      if (corpoDeReplay === null) {
        await auditAction(tx, {
          tenantId: args.tenantId,
          actorId: args.actorId,
          command: "ingestao-observacoes",
          aggregateType: "encounter",
          aggregateId: args.encontroId,
          outcome: "recusada",
          idempotencyKey: args.idempotencyKey,
        });
        return { kind: "replay-nao-publicavel" } as const;
      }
      return { kind: "replayed", body: corpoDeReplay } as const;
    }

    // Encontro provisionado? (404 indistinguível entre inexistente e cross-tenant.)
    const encounters = await listActiveEncounters(tx);
    const encounter = encounters.find((e) => e.encounterId === args.encontroId);
    if (encounter === undefined) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "ingestao-observacoes",
        aggregateType: "encounter",
        aggregateId: args.encontroId,
        outcome: "recusada",
        idempotencyKey: args.idempotencyKey,
      });
      return { kind: "encounter-not-found" } as const;
    }
    if (encounter.subjectRef !== args.pacienteRef) {
      return {
        kind: "mismatch",
        detail: "pacienteRef não corresponde ao paciente do encontro.",
      } as const;
    }
    if (encounter.bedId !== args.leitoId) {
      return { kind: "mismatch", detail: "leitoId não corresponde ao leito do encontro." } as const;
    }

    const agora = new Date();
    const agoraIso = agora.toISOString();

    // Envelope de origem imutável — payload cru retido para replay (ADR-0005 M1).
    const envelopeId = `SYNTH-ENV-${randomUUID()}`;
    await insertSourceEnvelope(tx, {
      id: envelopeId,
      tenantId: args.tenantId,
      sourceSystem: "SYNTH-api-ingest",
      receivedAt: nowInstant(),
      rawPayload: args.rawBody,
    });

    // Fatos clínicos canônicos + outbox por observação (mesma transação).
    for (const obs of args.aceitas) {
      const kernelParam = PARAM_TO_KERNEL[obs.parametro];
      const ucum =
        obs.unidade !== undefined ? canonicalUnitFor(kernelParam, obs.unidade) : undefined;
      const clinicalTime = clinicalInstantFromIso(obs.coletadoEm);
      await insertClinicalObservationWithOutbox(
        tx,
        {
          id: `SYNTH-OBS-${randomUUID()}`,
          tenantId: args.tenantId,
          subjectRef: args.pacienteRef,
          encounterId: args.encontroId,
          concept: PARAM_TO_CONCEPT[obs.parametro],
          value: {
            ...(obs.valor !== undefined ? { sourceValue: obs.valor } : {}),
            ...(obs.unidade !== undefined ? { sourceUnit: obs.unidade } : {}),
            ...(obs.codigo !== undefined ? { sourceCode: obs.codigo } : {}),
            // Par canônico por ALIAS de unidade (identidade — sem conversão numérica).
            ...(ucum !== undefined && obs.valor !== undefined
              ? { canonicalValue: obs.valor, canonicalUnit: ucum }
              : {}),
          },
          quality: "valid",
          provenance: {
            sourceSystem: "SYNTH-api-ingest",
            sourceEnvelopeId: envelopeId,
            transformation:
              ucum !== undefined && ucum !== obs.unidade
                ? `unit-alias:${obs.unidade ?? ""}->${ucum}`
                : "none",
            mappingVersion: "SYNTH-map-0",
            collector: "apps/api",
          },
          observedAt: clinicalTime,
          effectiveAt: clinicalTime,
          issuedAt: absentInstant("nao_informado_pela_fonte"),
          receivedAt: nowInstant(),
          persistedAt: nowInstant(),
        },
        `encounter:${args.encontroId}`,
      );
    }

    // Evento de nível de envelope (contrato pt-BR), mesma transação.
    await insertOutboxEvent(tx, {
      tenantId: args.tenantId,
      orderingScope: `encounter:${args.encontroId}`,
      eventType: "observacoes-ingeridas",
      aggregateType: "source_envelope",
      aggregateId: envelopeId,
      payload: {
        encontroId: args.encontroId,
        leitoId: args.leitoId,
        pacienteRef: args.pacienteRef,
        aceitas: args.aceitas.length,
        quarentena: args.quarentena.length,
      },
    });

    // Avaliação NEWS2 sobre TODAS as observações persistidas do encontro,
    // DESPACHADA pelo registro de regras. Quando qualquer porta do despachante
    // recusa (artefato ausente, motor divergente, regra desligada), NÃO há
    // registro de kernel e NÃO há escore: `resultadoNaoAvaliadoNews2` devolve
    // `status: "indisponivel"` com escore/banda `null` e o texto pt-BR da
    // recusa (HAZ-0005 — ausência de resultado nunca vira zero, e ausência de
    // resultado não é ausência de risco; ADR-0008 §8.3).
    const persisted = await listClinicalObservationsForEncounter(tx, args.encontroId);

    // news2_prev — estado anterior da série do paciente, lido EM-TRANSAÇÃO
    // ANTES de a nova avaliação existir (CRIT-1; gatilho de borda do
    // catálogo irmão ALERT-EWS-NEWS2-DETERIORATION-01). A última avaliação
    // persistida do sujeito (seq desc) fornece total + vermelhos. Ausente,
    // não computável ou de forma inesperada ⇒ DESCONHECIDO — o kernel ARMA
    // o gatilho (premissa reversível documentada; pendente ratificação
    // RAT-EWS trigger policy).
    const avaliacoesAnteriores = await listEvaluationRecordsBySubject(tx, args.pacienteRef);
    const estadoAnteriorLido =
      avaliacoesAnteriores.length > 0
        ? estadoAnteriorDeAvaliacao(avaliacoesAnteriores[0]!)
        : undefined;
    const despacho = despacharNews2(
      args.registroDeRegras,
      {
        observacoes: persisted,
        contexto: args.contexto,
        estadoAnterior: estadoAnteriorLido ?? undefined,
      },
      { instanteIso: agoraIso, correlacaoId: envelopeId },
    );
    const record = despacho.tipo === "avaliada" ? despacho.resultado.registroKernel : null;
    // `resultadoNews2Publicavel` é o ponto ÚNICO que cobre os DOIS desfechos
    // (avaliada e recusada) e anexa o envelope de MODO DE DESPACHO ao
    // resultado. Antes daqui o registro era computado, gravado no outbox e
    // então DESCARTADO da resposta: a degradação mais estrutural do sistema
    // (0 vias acionáveis; artefato sem cadeia de assinatura, ADR-0007 C5
    // aberta) ficava invisível para quem olha a tela — exatamente o que
    // QAS-0023 exige que seja zero.
    //
    // `acionavel` NÃO é copiado do registro: a projeção o RECALCULA por
    // `ehAcionavel`. Nada aqui promove nada.
    const avaliacao: ComModoDeDespacho<ResultadoAvaliacao> = resultadoNews2Publicavel(despacho);

    const evaluationId = `SYNTH-AVAL-${randomUUID()}`;
    await insertEvaluationRecord(tx, {
      id: evaluationId,
      tenantId: args.tenantId,
      encounterId: args.encontroId,
      subjectRef: args.pacienteRef,
      status: avaliacao.status,
      totalScore: avaliacao.escore,
      riskTier: avaliacao.banda,
      redParameter: avaliacao.parametroVermelho,
      // Identidade durável da regra (MAJ-5, ADR-0025 §5.2 item 4): vem de
      // `despacho.registro` — presente TANTO na avaliação quanto na recusa
      // (onde `record` é null) — e na MESMA inserção que persiste o
      // `kernel_record`. O JSON deixa de ser o único lugar onde a versão
      // persistida identifica o algoritmo que de facto correu.
      ruleId: despacho.registro.ruleId,
      ruleVersion: despacho.registro.ruleVersion,
      // Recusa de despacho ⇒ nenhum registro de kernel: `fires` é `false` e o
      // registro persistido fica vazio. Herdar `true` de uma avaliação que não
      // aconteceu seria fabricar condição de exibição.
      fires: record?.fires ?? false,
      evaluatedAt: nowInstant(),
      result: avaliacao as unknown as Record<string, unknown>,
      kernelRecord: (record ?? {}) as unknown as Record<string, unknown>,
    });
    await insertOutboxEvent(tx, {
      tenantId: args.tenantId,
      orderingScope: `encounter:${args.encontroId}`,
      eventType: "avaliacao-computada",
      aggregateType: "evaluation_record",
      aggregateId: evaluationId,
      payload: {
        encontroId: args.encontroId,
        status: avaliacao.status,
        escore: avaliacao.escore,
        banda: avaliacao.banda,
      },
    });

    // REGISTRO IMUTÁVEL do despacho, durável na MESMA transação (requisito 5
    // do achado §6.4): versão de regra, versão de bundle, digest das entradas,
    // razões, proveniência e correlação. Vale igualmente para a recusa — é
    // justamente a recusa que precisa ser auditável depois.
    //
    // `regra-despachada` NÃO pertence ao vocabulário de `EventoFluxo` do
    // contrato (`packages/contratos/asyncapi.yaml`), e por isso `replayEvents`
    // não o publica no fluxo: ele é registro durável interno, não mensagem de
    // canal. Ver a nota em `OUTBOX_TO_CONTRACT_EVENT`.
    await insertOutboxEvent(tx, {
      tenantId: args.tenantId,
      orderingScope: `encounter:${args.encontroId}`,
      eventType: "regra-despachada",
      aggregateType: "evaluation_record",
      aggregateId: evaluationId,
      payload: despacho.registro as unknown as Record<string, unknown>,
    });

    // Alerta durável + item de trabalho + outbox — MESMA transação. O
    // GATILHO é de BORDA (requerAlerta → `record.alertCrossing`; catálogo
    // irmão ALERT-EWS-NEWS2-DETERIORATION-01; CRIT-1) e, sempre que a
    // condição de EXIBIÇÃO de escalonamento está acima do patamar (`fires`,
    // spec §4.2), a política de SUPRESSÃO é consultada ANTES de criar o
    // item (CRIT-2): dedup `paciente+news2-deterioration`, cooldown PT4H,
    // teto 3/24h — premissas de engenharia do catálogo irmão, pendentes de
    // ratificação (RAT-EWS), parametrizadas em `POLITICA_SUPRESSAO_NEWS2`.
    //
    // Substrato do last-emit: leitura EM-TRANSAÇÃO dos itens de trabalho já
    // existentes deste encontro (a consulta por paciente não existe em
    // `packages/persistencia` e este stream não a cria — premissa
    // reversível; transferências entre encontros podem re-emitir).
    //
    // Ingestão suprimida CONTINUA avaliada e auditada; a supressão é
    // AUDITADA com motivo (`command: "alerta-suprimido"`) — supressão
    // silenciosa é o mesmo defeito de alerta silencioso.
    let alerta: ResumoItemTrabalho | null = null;
    if (record?.fires && !record.escalationSuppressed) {
      const itensDoEncontro = (await listWorkItemsWithAlerts(tx)).filter(
        (i) => i.encounterId === args.encontroId,
      );
      const emitesMs = itensDoEncontro
        .map((i) => (i.raisedAt.kind === "present" ? Date.parse(i.raisedAt.instant.utc) : null))
        .filter((t): t is number => t !== null);
      const veredito = deveriaEmitirAlerta(
        chaveDeDedupNews2(args.pacienteRef),
        Date.parse(agoraIso),
        {
          ultimoEmitMs: emitesMs.length > 0 ? Math.max(...emitesMs) : null,
          emitesMs24h: emitesMs,
        },
        POLITICA_SUPRESSAO_NEWS2,
        null,
      );
      if (veredito.tipo === "emitir" && requerAlerta(record)) {
        const alertId = `SYNTH-ALERTA-${randomUUID()}`;
        await insertAlert(tx, {
          id: alertId,
          tenantId: args.tenantId,
          encounterId: args.encontroId,
          raisedAt: nowInstant(),
          evaluatedAt: nowInstant(),
          severity: avaliacao.banda ?? "critico",
          reason: avaliacao.explicacao,
          ...(avaliacao.escore !== null ? { score: avaliacao.escore } : {}),
        });
        await insertWorkItem(tx, { id: alertId, tenantId: args.tenantId, alertId });
        await insertOutboxEvent(tx, {
          tenantId: args.tenantId,
          orderingScope: `encounter:${args.encontroId}`,
          eventType: "alerta-criado",
          aggregateType: "work_item",
          aggregateId: alertId,
          payload: { id: alertId, estado: "nao-atribuido", versao: 0 },
        });
        alerta = { id: alertId, estado: "nao-atribuido", versao: 0 };
      } else if (veredito.tipo === "suprimir") {
        await insertAuditEvent(tx, {
          id: `SYNTH-AUDIT-${randomUUID()}`,
          tenantId: args.tenantId,
          actorId: args.actorId,
          command: "alerta-suprimido",
          aggregateType: "evaluation_record",
          aggregateId: evaluationId,
          newState: veredito.motivo,
          occurredAt: nowInstant(),
          idempotencyKey: `${args.idempotencyKey}-alerta-suprimido`,
        });
      }
    }

    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "ingestao-observacoes",
      aggregateType: "encounter",
      aggregateId: args.encontroId,
      outcome: "sucesso",
      idempotencyKey: args.idempotencyKey,
    });

    const body: IngestaoObservacoesResposta = {
      encontroId: args.encontroId,
      recebidoEm: agoraIso,
      aceitas: [...args.aceitas],
      quarentena: [...args.quarentena],
      avaliacao,
      alerta,
    };

    await insertIdempotencyRecord(tx, {
      tenantId: args.tenantId,
      idempotencyKey: args.idempotencyKey,
      requestHash: args.requestHash,
      statusCode: 201,
      responseBody: body as unknown as Record<string, unknown>,
    });

    return { kind: "created", body } as const;
  });
}

// --- projeção: grade de leitos ----------------------------------------------

function calcularFrescor(evaluatedAtIso: string | null, agora: Date): Frescor {
  if (evaluatedAtIso === null) return "desatualizado";
  const idadeMs = agora.getTime() - new Date(evaluatedAtIso).getTime();
  if (idadeMs <= FRESCOR_ATUAL_MS) return "atual";
  if (idadeMs <= FRESCOR_ENVELHECENDO_MS) return "envelhecendo";
  return "desatualizado";
}

/**
 * Projeção de leitura da grade de leitos, LIDA DO BANCO (leitos, encontros
 * ativos, avaliação mais recente por encontro, item de trabalho mais
 * recente), escopada ao tenant pela RLS (ADR-0011 P1/P2). O status
 * exibido é REAVALIADO em tempo de leitura (spec §5.3 via
 * `reassessNews2AtReadTime`): um `valido` envelhecido degrada para
 * `desatualizado`/`indisponivel` — escore some junto (nunca um número
 * velho parecendo fresco; HAZ-0005).
 *
 * ACH-REV8-3: `modoAvaliacao` é submetido ao `CatalogoDeAutoridade` do
 * runtime (`args.registroDeRegras`), não apenas lido/checado por coerência
 * interna do `result` persistido — ver `regras/exposicao.ts`.
 */
export async function projectBedGrid(
  db: PortaBancoDeDados,
  args: {
    tenantId: string;
    actorId: string;
    correlationId: string;
    registroDeRegras: RegistroDeRegras;
  },
): Promise<EntradaGradeLeitos[]> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const [beds, encounters, evaluations, workItems] = [
      await listBeds(tx),
      await listActiveEncounters(tx),
      await listLatestEvaluationPerEncounter(tx),
      await listWorkItemsWithAlerts(tx),
    ];

    const agora = new Date();
    const entradas: EntradaGradeLeitos[] = beds.map((bed) => {
      const encounter = encounters.find((e) => e.bedId === bed.id);
      if (encounter === undefined) {
        return {
          leitoId: bed.id,
          encontroId: null,
          pacienteRef: null,
          escore: null,
          banda: null,
          statusAvaliacao: null,
          frescor: "desatualizado",
          atualizadoEm: null,
          alerta: null,
          // Leito desocupado: não há avaliação e portanto não há modo de
          // despacho registrado. `null` — nunca ausência por esquecimento —
          // porque o contrato define `null` como "modo NÃO registrado, trate
          // a linha como NÃO acionável" (QAS-0023).
          modoAvaliacao: null,
        };
      }

      const evaluation = evaluations.find((ev) => ev.encounterId === encounter.encounterId);
      const workItem = workItems.find((w) => w.encounterId === encounter.encounterId);
      const alerta: ResumoItemTrabalho | null =
        workItem === undefined
          ? null
          : { id: workItem.id, estado: hyphenState(workItem.state), versao: workItem.version };

      if (evaluation === undefined) {
        return {
          leitoId: bed.id,
          encontroId: encounter.encounterId,
          pacienteRef: encounter.subjectRef,
          escore: null,
          banda: null,
          statusAvaliacao: null,
          frescor: "desatualizado",
          atualizadoEm: null,
          alerta,
          // Encontro ativo sem nenhuma avaliação persistida — mesma leitura
          // fail-closed do ramo acima.
          modoAvaliacao: null,
        };
      }

      const evaluatedAtIso = toIsoOrNull(evaluation.evaluatedAt);
      // Lido do `result` PERSISTIDO, fail-closed: forma inválida, campo
      // ausente (linha gravada antes desta versão do contrato), alegação sem
      // autoridade que a sustente, ou `acionavel` divergente do que a
      // AUTORIDADE deriva devolvem `null`, e nunca um valor "corrigido"
      // (ACH-REV8-3 — a checagem é de AUTORIDADE contra
      // `args.registroDeRegras`, não de coerência interna do blob).
      // Deliberadamente calculado ANTES da reavaliação em tempo de leitura e
      // NÃO tocado por ela: a reavaliação descreve FRESCOR do dado, não o
      // MODO DE ATIVAÇÃO do artefato que governou o despacho — um escore que
      // envelheceu continua tendo sido despachado em sombra.
      const modoAvaliacao = modoDeDespachoDoResultadoPersistido(
        evaluation.result,
        autoridadeDeLeituraOuIndisponivel(args.registroDeRegras, agora.toISOString()),
      );
      let statusAvaliacao = evaluation.status as StatusAvaliacao;
      let escore = evaluation.totalScore;
      let banda = evaluation.riskTier as BandaRisco | null;

      // Reavaliação em TEMPO DE LEITURA (spec §5.3): valido envelhecido
      // degrada explicitamente; escore/banda somem junto (HAZ-0005).
      if (statusAvaliacao === "valido") {
        const reassessed = reassessNews2AtReadTime(
          evaluation.kernelRecord as unknown as EvaluationRecord,
          agora.toISOString(),
        );
        if (reassessed.status === "stale") {
          statusAvaliacao = "desatualizado";
          escore = null;
          banda = null;
        } else if (reassessed.status === "not_evaluated") {
          statusAvaliacao = "indisponivel";
          escore = null;
          banda = null;
        }
      } else {
        escore = null;
        banda = null;
      }

      return {
        leitoId: bed.id,
        encontroId: encounter.encounterId,
        pacienteRef: encounter.subjectRef,
        escore,
        banda,
        statusAvaliacao,
        frescor: calcularFrescor(evaluatedAtIso, agora),
        atualizadoEm: evaluatedAtIso,
        alerta,
        modoAvaliacao,
      };
    });

    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-grade-leitos",
      aggregateType: "tenant",
      aggregateId: args.tenantId,
      outcome: "sucesso",
      idempotencyKey: args.correlationId,
    });

    return entradas.sort((a, b) => a.leitoId.localeCompare(b.leitoId));
  });
}

// --- leitura: avaliações por paciente ---------------------------------------

/**
 * `null` se o paciente é desconhecido OU pertence a outro tenant —
 * indistinguíveis por desenho.
 *
 * ACH-REV8-3 (vetor A): `row.result` vem do armazenamento e não prova nada
 * sobre si — `resultadoPersistidoPublicavel` submete o `despacho` de CADA
 * linha ao `CatalogoDeAutoridade` do runtime (`args.registroDeRegras`) antes
 * de publicar; sem autoridade que sustente a alegação, `despacho` sai `null`
 * (fail-closed por AUSÊNCIA DE AUTORIDADE, nunca por incoerência interna do
 * blob — ver `regras/exposicao.ts`). O resto do `result` (escore, banda,
 * status, motivos) continua sendo republicado como persistido; o escopo
 * deste fecho é ACIONABILIDADE.
 */
export async function getPatientEvaluations(
  db: PortaBancoDeDados,
  args: {
    tenantId: string;
    actorId: string;
    pacienteRef: string;
    correlationId: string;
    registroDeRegras: RegistroDeRegras;
  },
): Promise<ResultadoAvaliacao[] | null> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const rows = await listEvaluationRecordsBySubject(tx, args.pacienteRef);
    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-avaliacoes-paciente",
      aggregateType: "patient",
      aggregateId: args.pacienteRef,
      outcome: rows.length > 0 ? "sucesso" : "recusada",
      idempotencyKey: args.correlationId,
    });
    if (rows.length === 0) return null;
    const instanteIso = new Date().toISOString();
    return rows.map((row) =>
      resultadoPersistidoPublicavel(
        row.result,
        autoridadeDeLeituraOuIndisponivel(args.registroDeRegras, instanteIso),
      ),
    );
  });
}

// --- comando: reconhecer alerta (ADR-0009 W1/W3) ----------------------------

export type AcknowledgeOutcome =
  | { readonly kind: "not-found" }
  | { readonly kind: "version-conflict"; readonly atual: ItemTrabalho }
  | { readonly kind: "illegal-transition"; readonly atual: ItemTrabalho }
  | {
      readonly kind: "applied";
      readonly item: ItemTrabalho;
      /**
       * Estado de ONDE a transição partiu, na forma canônica de
       * `@intensicare/dominio`. Existe para que a telemetria de transição
       * (`recordWorkItemTransition`) reporte o par real; sem ele o chamador
       * teria de passar `null` ou adivinhar — e um par inventado é pior que
       * um contador ausente.
       */
      readonly estadoAnterior: WorkItemState;
    };

function buildItemTrabalho(
  row: WorkItemWithAlertRow,
  encounter: ActiveEncounterRow | undefined,
  tenantId: string,
): ItemTrabalho {
  return {
    id: row.id,
    estado: hyphenState(row.state),
    versao: row.version,
    tenantId,
    encontroId: row.encounterId,
    leitoId: encounter?.bedId ?? "",
    pacienteRef: encounter?.subjectRef ?? "",
    escore: row.score ?? 0,
    banda: row.severity as BandaRisco,
    motivo: row.reason,
    criadoEm: pgTimestampToIso(row.createdAt),
    atualizadoEm: pgTimestampToIso(row.createdAt),
  };
}

/**
 * Reconhecimento com concorrência otimista REAL: legalidade da transição
 * decidida pela máquina pura de `@intensicare/dominio`
 * (`isLegalWorkItemTransition`) e efeito aplicado por comparação-e-troca
 * no repositório (`transitionWorkItem`), que grava auditoria + outbox na
 * MESMA transação (ADR-0009 W6; ADR-0010 B1). Conflito de versão devolve
 * o estado corrente para redecisão humana — nunca last-write-wins.
 *
 * PREMISSA (reversível, GDEC-0015/0017): "reconhecer" sobre item ainda
 * `nao_atribuido` executa atribuição implícita AO PRÓPRIO ator (comando
 * `assign`) seguida do reconhecimento, na MESMA transação — o grafo do
 * ADR-0009 W1 não admite `nao_atribuido → reconhecido` direto, e ambos os
 * comandos carregam o MESMO ator humano identificado (W4/W12); cada um
 * gera sua própria auditoria e evento de outbox.
 */
export async function acknowledgeAlert(
  db: PortaBancoDeDados,
  args: {
    tenantId: string;
    actorId: string;
    workItemId: string;
    expectedVersion: number;
    correlationId: string;
  },
): Promise<AcknowledgeOutcome> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const found = await getWorkItem(tx, args.workItemId);
    if (found === undefined) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "not-found" } as const;
    }

    const withAlert = (await listWorkItemsWithAlerts(tx)).find((w) => w.id === args.workItemId);
    const encounters = await listActiveEncounters(tx);
    const encounter = encounters.find((e) => e.encounterId === withAlert?.encounterId);
    if (withAlert === undefined) return { kind: "not-found" } as const;
    const atual = buildItemTrabalho(withAlert, encounter, args.tenantId);

    if (found.version !== args.expectedVersion) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "version-conflict", atual } as const;
    }

    const state = found.state as WorkItemState;
    const viaAssign = state === "nao_atribuido";
    const legal = viaAssign
      ? isLegalWorkItemTransition("nao_atribuido", "atribuido") &&
        isLegalWorkItemTransition("atribuido", "reconhecido")
      : isLegalWorkItemTransition(state, "reconhecido");
    if (!legal) {
      await auditAction(tx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        command: "acknowledge",
        aggregateType: "work_item",
        aggregateId: args.workItemId,
        outcome: "recusada",
        idempotencyKey: args.correlationId,
      });
      return { kind: "illegal-transition", atual } as const;
    }

    let expectedVersion = args.expectedVersion;
    if (viaAssign) {
      // Atribuição implícita ao próprio ator — ver PREMISSA acima.
      const assignOutcome = await transitionWorkItem(tx, {
        workItemId: args.workItemId,
        tenantId: args.tenantId,
        expectedVersion,
        nextState: "atribuido",
        actorId: args.actorId,
        command: "assign",
        idempotencyKey: args.correlationId,
        assigneeId: args.actorId,
        occurredAt: nowInstant(),
        outboxEventType: "alerta-atualizado",
        orderingScope: `work_item:${args.workItemId}`,
      });
      if (assignOutcome.outcome === "conflict") {
        return { kind: "version-conflict", atual } as const;
      }
      expectedVersion = assignOutcome.newVersion;
    }

    const outcome = await transitionWorkItem(tx, {
      workItemId: args.workItemId,
      tenantId: args.tenantId,
      expectedVersion,
      nextState: "reconhecido",
      actorId: args.actorId,
      command: "acknowledge",
      idempotencyKey: args.correlationId,
      occurredAt: nowInstant(),
      outboxEventType: "alerta-atualizado",
      orderingScope: `work_item:${args.workItemId}`,
    });
    if (outcome.outcome === "conflict") {
      return { kind: "version-conflict", atual } as const;
    }

    const agoraIso = new Date().toISOString();
    const item: ItemTrabalho = {
      ...atual,
      estado: "reconhecido",
      versao: outcome.newVersion,
      atualizadoEm: agoraIso,
      reconhecidoPor: args.actorId,
      reconhecidoEm: agoraIso,
    };
    return { kind: "applied", item, estadoAnterior: state } as const;
  });
}

// --- fluxo de eventos (replay por cursor, ADR-0011 P4) ----------------------

/**
 * Tradução do tipo de evento do OUTBOX (vocabulário interno de persistência)
 * para o vocabulário FECHADO de `EventoFluxo` do contrato
 * (`packages/contratos/asyncapi.yaml`).
 *
 * Linha do outbox sem entrada aqui NÃO é publicada no fluxo. Antes havia um
 * `?? "observacao-clinica-registrada"`, que rotularia qualquer tipo novo como
 * observação clínica — um quadro SSE que mente sobre o que carrega. É o caso
 * de `regra-despachada` (registro imutável de despacho, ver
 * `ingestObservations`): ele é durável e auditável, e não é mensagem de canal.
 * Omitir é honesto; renomear seria falsificar.
 */
const OUTBOX_TO_CONTRACT_EVENT: Readonly<Record<string, EventoFluxo["tipo"]>> = {
  clinical_observation_recorded: "observacao-clinica-registrada",
  "observacoes-ingeridas": "observacoes-ingeridas",
  "avaliacao-computada": "avaliacao-computada",
  "alerta-criado": "alerta-criado",
  "alerta-atualizado": "alerta-atualizado",
};

export async function replayEvents(
  db: PortaBancoDeDados,
  args: { tenantId: string; actorId: string; cursor: number; correlationId: string },
): Promise<EventoFluxo[]> {
  return withTenantTransaction(db, args.tenantId, async (tx) => {
    const rows = await listOutboxEvents(tx, args.cursor);
    await auditAction(tx, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      command: "leitura-eventos-stream",
      aggregateType: "tenant",
      aggregateId: args.tenantId,
      outcome: "sucesso",
      idempotencyKey: args.correlationId,
    });
    const eventos: EventoFluxo[] = [];
    for (const row of rows) {
      const tipo = OUTBOX_TO_CONTRACT_EVENT[row.eventType];
      if (tipo === undefined) continue;
      // ACH-O3-6 (fecho PARCIAL). `EventoFluxo.sequencia` é declarado
      // `type: integer, minimum: 0` no `asyncapi.yaml` e é o CURSOR DURÁVEL de
      // retomada (ADR-0011 P4), que sai também no `id:` do quadro SSE.
      // `outbox_events.id` é `bigserial` e começa em 1 — nenhum caminho
      // legítimo produz `sequencia <= 0`; uma linha PLANTADA produz (a
      // aplicação tem `insert` nessa tabela, `0001_init.sql:288`), e o quadro
      // resultante viraria cursor de retomada fabricado no cliente. Mesma
      // disciplina do `tipo` desconhecido logo acima: o que não é publicável
      // não é publicado — omitir é honesto, emitir seria falsificar o cursor.
      //
      // Isto NÃO valida `dados`: o contrato declara aquele campo NÃO tipado
      // por variante (`asyncapi.yaml`, schema `EventoFluxo`; catálogo §5.3), e
      // tipá-lo é decisão de CONTRATO — ver `db.test.ts` e o handoff.
      if (!Number.isInteger(row.id) || row.id <= 0) continue;
      eventos.push({
        sequencia: row.id,
        tipo,
        tenantId: row.tenantId,
        ocorridoEm: pgTimestampToIso(row.occurredAt),
        dados: row.payload,
      });
    }
    return eventos;
  });
}
