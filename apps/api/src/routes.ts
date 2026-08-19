/**
 * apps/api/src/routes.ts — rotas `/v1/*` do IntensiCare V2 (fatia SPR-G7-2,
 * INTEGRAÇÃO REAL).
 *
 * Fluxo: ingestão → persistência (PGlite via `@intensicare/persistencia`,
 * envelope de origem + proveniência) → avaliação NEWS2 REAL
 * (`@intensicare/kernel-clinico`) → status explícito → alerta durável +
 * outbox na MESMA transação → projeção de grade de leitos lida do banco →
 * reconhecer com concorrência otimista (If-Match/versão) → auditoria
 * append-only em toda leitura/ação. Toda rota exige o contexto de tenant
 * do stub de autenticação (`auth.ts`) e a RLS por tenant faz o escopo de
 * TODA consulta/escrita (regra dura §3-6 do prompt; ADR-0011 P2).
 */

import {
  type AvaliacoesPacienteResposta,
  type GradeLeitosResposta,
  type HealthzResposta,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  IF_MATCH_HEADER,
  type ObservacaoEmQuarentena,
  type ObservacaoEntrada,
  PROBLEM_JSON_MIME_TYPE,
  type ProblemDetails,
  type ProblemDetailsConflitoVersao,
  type ReconhecerAlertaResposta,
} from "@intensicare/contratos";
import { buildG7SyntheticScenario } from "@intensicare/fixtures-sinteticas";
import type { Telemetry } from "@intensicare/observabilidade";
import type { PortaBancoDeDados } from "@intensicare/persistencia";
import type { FastifyInstance, FastifyReply } from "fastify";
import { autenticar, type PortaDeAutenticacao } from "./auth.js";
import { ESCOPO_DE_SONDAGEM } from "./composicao/prontidao.js";
import {
  acknowledgeAlert,
  getPatientEvaluations,
  hashRequestBody,
  ingestObservations,
  projectBedGrid,
} from "./db.js";
import type { NotificadorEmMemoria } from "./eventos/porta.js";
import { instanciaSegura } from "./problema.js";
import type { RegistroDeRegras } from "./regras/index.js";
import { criarTelemetriaApi } from "./saude/telemetria.js";
import {
  idempotencyKeyHeaderSchema,
  ifMatchHeaderSchema,
  ingestaoObservacoesRequisicaoSchema,
  observacaoEntradaSchema,
  reconhecerAlertaRequisicaoSchema,
} from "./schemas.js";

function primeiroValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function enviarProblema(
  reply: FastifyReply,
  status: number,
  title: string,
  detail: string,
  instance: string,
): FastifyReply {
  const problema: ProblemDetails = { type: "about:blank", title, status, detail, instance };
  return reply.code(status).type(PROBLEM_JSON_MIME_TYPE).send(problema);
}

/**
 * Recusa de autenticação com o STATUS QUE A PORTA DECIDIU.
 *
 * Antes, as cinco rotas respondiam `reply.code(401)` fixo. A porta de
 * autenticação distingue 401 (não foi possível estabelecer identidade) de 403
 * (identidade estabelecida, concessão insuficiente — tenant não autorizado,
 * tenant divergente do escopo, workload com escopo clínico amplo) e já monta o
 * corpo com o status correto. Enviar 401 com um corpo que diz 403 é um
 * envelope que se contradiz, e faz um cliente tentar reautenticar quando o
 * problema é de autorização.
 */
function recusarAutenticacao(reply: FastifyReply, problema: ProblemDetails): FastifyReply {
  return reply.code(problema.status).type(PROBLEM_JSON_MIME_TYPE).send(problema);
}

/**
 * Fiação de desenvolvimento da rota `POST /v1/dev/sessao`. `undefined` ⇒ a
 * rota NÃO é registrada (404), que é diferente de registrá-la e responder 403:
 * uma superfície que responde 403 continua anunciando que existe.
 */
export interface SessaoDeDesenvolvimento {
  readonly porta: PortaDeAutenticacao;
}

export interface OpcoesDeRotasV1 {
  /** Registro de regras versionadas — a ingestão despacha por ele (ADR-0007). */
  readonly registroDeRegras: RegistroDeRegras;
  /** Telemetria injetada; os gravadores tipados são criados a partir dela. */
  readonly telemetry: Telemetry;
  /**
   * Despertador do gateway de eventos, acordado DEPOIS de cada escrita durável
   * bem-sucedida. Sem ele a entrega degrada para a latência da pulsação —
   * nunca para perda, porque a pulsação também relê o backbone durável.
   */
  readonly notificador: NotificadorEmMemoria;
  /** Ver `SessaoDeDesenvolvimento`. Só em perfil que admite adaptador sintético. */
  readonly sessaoDeDesenvolvimento?: SessaoDeDesenvolvimento | undefined;
}

/**
 * Ator sintético da sessão de desenvolvimento. Prefixo `SYNTH-`, como todo
 * identificador desta fatia — nunca um identificador realista (anti-padrão 17).
 */
const ATOR_SESSAO_DE_DESENVOLVIMENTO = "SYNTH-PROFISSIONAL-WEB";

export function registrarRotasV1(
  app: FastifyInstance,
  db: PortaBancoDeDados,
  opcoes: OpcoesDeRotasV1,
): void {
  const telemetria = criarTelemetriaApi(opcoes.telemetry);

  // Correlação: ecoa o id interno de requisição do Fastify como
  // cabeçalho de resposta, para toda rota (prompt §12.1 — IDs de
  // correlação/causação nas convenções de contrato de API).
  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-correlation-id", request.id);
    return payload;
  });

  app.get("/v1/healthz", async () => {
    // Liveness COM toque de banco — nem liveness pura nem prontidão. Mantido
    // por compatibilidade; promoção aponta para `/v1/readyz` (ADR-0020 O4).
    // `checkConnection` não serve mais aqui: ele tipa em `PGlite`, e a
    // aplicação passou a circular a PORTA, que só dá acesso com escopo.
    await db.comTenant(ESCOPO_DE_SONDAGEM, async (tx) => tx.query("select 1 as um"));
    const resposta: HealthzResposta = { status: "ok" };
    return resposta;
  });

  app.post("/v1/ingestao/observacoes", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return recusarAutenticacao(reply, auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const idempKeyParsed = idempotencyKeyHeaderSchema.safeParse(
      primeiroValor(request.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()]),
    );
    if (!idempKeyParsed.success) {
      return enviarProblema(
        reply,
        400,
        "Cabeçalho de idempotência ausente ou inválido",
        idempKeyParsed.error.issues[0]?.message ??
          `O cabeçalho ${IDEMPOTENCY_KEY_HEADER} é obrigatório.`,
        instanciaSegura(request),
      );
    }
    const idempotencyKey = idempKeyParsed.data;

    const corpoParsed = ingestaoObservacoesRequisicaoSchema.safeParse(request.body);
    if (!corpoParsed.success) {
      return enviarProblema(
        reply,
        400,
        "Envelope de ingestão malformado",
        corpoParsed.error.issues.map((i) => i.message).join("; "),
        instanciaSegura(request),
      );
    }
    const { encontroId, leitoId, pacienteRef, observacoes, contexto } = corpoParsed.data;

    const aceitas: ObservacaoEntrada[] = [];
    const quarentena: ObservacaoEmQuarentena[] = [];
    for (const entradaBruta of observacoes) {
      const parsedObs = observacaoEntradaSchema.safeParse(entradaBruta);
      if (parsedObs.success) {
        aceitas.push(parsedObs.data as ObservacaoEntrada);
      } else {
        quarentena.push({
          entrada: entradaBruta,
          motivo: parsedObs.error.issues.map((i) => i.message).join("; "),
        });
      }
    }

    const resultado = await ingestObservations(db, {
      tenantId,
      actorId: atorId,
      registroDeRegras: opcoes.registroDeRegras,
      idempotencyKey,
      requestHash: hashRequestBody(request.body),
      encontroId,
      leitoId,
      pacienteRef,
      contexto,
      aceitas,
      quarentena,
      rawBody: request.body,
    });

    switch (resultado.kind) {
      case "replayed":
        // ACH-O3-3: 201 é o código que o `openapi.yaml` declara para o replay
        // ("`Idempotency-Replayed: false` numa primeira chamada, `true` num
        // reenvio da mesma chave", sob a resposta "201"). Antes, o código vinha
        // de `idempotency_records.status_code` — uma coluna em que o papel da
        // aplicação tem `insert` —, e com ele o atacante escolhia também o
        // status. O CORPO já vem reconstruído e submetido à autoridade por
        // `respostaDeReplayPublicavel` (`db.ts`); nada do blob atravessa aqui.
        reply.header(IDEMPOTENCY_REPLAYED_HEADER, "true");
        return reply.code(201).send(resultado.body);
      case "replay-nao-publicavel":
        // Há registro durável para esta chave, mas a resposta armazenada não
        // reconstrói na forma do contrato. O cliente não errou — o servidor é
        // que não consegue honrar o replay (RFC 9110 §15.6). Fail-closed: não
        // publicamos o blob, nem uma versão "lavada" dele, nem inventamos uma
        // avaliação no lugar. Nenhum detalhe interno viaja (SEC-0015).
        //
        // `telemetria.ingestRejeitado()` NÃO é emitido de propósito: esse
        // gravador é perda de INGESTÃO (`recordPipelineLoss` de
        // `source_to_accepted`), e aqui nada se perdeu — a ingestão original
        // está gravada. O evento fica na auditoria append-only, que `db.ts`
        // grava nesta mesma transação com desfecho `recusada`.
        return enviarProblema(
          reply,
          500,
          "Resposta idempotente não republicável",
          "Existe um registro para esta Idempotency-Key, mas a resposta original armazenada não passou na verificação exigida para ser republicada, e nenhuma resposta foi entregue em seu lugar. Nenhum efeito novo foi executado nesta requisição; o efeito da ingestão original permanece registrado. Consulte a projeção autoritativa para o estado corrente.",
          instanciaSegura(request),
        );
      case "key-conflict":
        telemetria.ingestRejeitado();
        return enviarProblema(
          reply,
          422,
          "Reuso de Idempotency-Key com corpo divergente",
          "Esta Idempotency-Key já foi usada com um corpo de requisição diferente. Reenvie o corpo original para obter a resposta original, ou use uma chave nova para uma nova escrita (draft IETF idempotency-key-header).",
          instanciaSegura(request),
        );
      case "encounter-not-found":
        telemetria.ingestRejeitado();
        return enviarProblema(
          reply,
          404,
          "Encontro não encontrado",
          "Nenhum encontro ativo com este id neste tenant.",
          instanciaSegura(request),
        );
      case "mismatch":
        telemetria.ingestRejeitado();
        return enviarProblema(
          reply,
          422,
          "Envelope incoerente com o encontro",
          resultado.detail,
          instanciaSegura(request),
        );
      case "created":
        // Escrita durável concluída: acorda as assinaturas do tenant. O
        // notificador NÃO transporta evento — o gateway relê o backbone a
        // partir do próprio cursor (ADR-0011 P1).
        opcoes.notificador.notificarMudancaEm(tenantId);
        // A latência de `source_to_accepted` NÃO é emitida aqui: o hook de
        // `instrumentarHttp` já a observa para esta rota (ver
        // `TEMPLATES_INSTRUMENTADOS`). Emitir nos dois lugares somava duas
        // observações da mesma etapa na mesma requisição e inflava o
        // histograma — uma emissão por etapa por requisição.
        //
        // Observação em quarentena é perda de ingestão que o limite HTTP não
        // enxerga: a resposta é 201 e, ainda assim, parte do envelope não
        // virou fato clínico.
        if (quarentena.length > 0) telemetria.ingestRejeitado(quarentena.length);
        reply.header(IDEMPOTENCY_REPLAYED_HEADER, "false");
        return reply.code(201).send(resultado.body);
    }
  });

  app.get("/v1/projecoes/grade-leitos", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return recusarAutenticacao(reply, auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const leitos = await projectBedGrid(db, {
      tenantId,
      actorId: atorId,
      correlationId: String(request.id),
      registroDeRegras: opcoes.registroDeRegras,
    });
    // Latência de `generated_to_visible` emitida pelo hook HTTP — ver nota
    // sobre emissão única na rota de ingestão.
    const resposta: GradeLeitosResposta = { leitos };
    return reply.code(200).send(resposta);
  });

  app.get("/v1/pacientes/:pacienteRef/avaliacoes", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return recusarAutenticacao(reply, auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const { pacienteRef } = request.params as { pacienteRef: string };
    const avaliacoes = await getPatientEvaluations(db, {
      tenantId,
      actorId: atorId,
      pacienteRef,
      correlationId: String(request.id),
      registroDeRegras: opcoes.registroDeRegras,
    });
    if (avaliacoes === null) {
      return enviarProblema(
        reply,
        404,
        "Paciente não encontrado",
        "Nenhuma avaliação encontrada para este paciente neste tenant.",
        instanciaSegura(request),
      );
    }

    // Latência de `generated_to_visible` emitida pelo hook HTTP — ver nota
    // sobre emissão única na rota de ingestão.
    const resposta: AvaliacoesPacienteResposta = { pacienteRef, avaliacoes };
    return reply.code(200).send(resposta);
  });

  app.post("/v1/alertas/:id/reconhecer", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return recusarAutenticacao(reply, auth.problema);
    const { tenantId, atorId } = auth.contexto;
    const { id } = request.params as { id: string };

    const ifMatchBruto = primeiroValor(request.headers[IF_MATCH_HEADER.toLowerCase()]);
    if (ifMatchBruto === undefined) {
      return enviarProblema(
        reply,
        428,
        "Cabeçalho If-Match obrigatório",
        `Envie a versão vista do recurso no cabeçalho ${IF_MATCH_HEADER} para reconhecer com segurança de concorrência.`,
        instanciaSegura(request),
      );
    }
    const ifMatchParsed = ifMatchHeaderSchema.safeParse(ifMatchBruto);
    if (!ifMatchParsed.success) {
      return enviarProblema(
        reply,
        400,
        "Cabeçalho If-Match inválido",
        ifMatchParsed.error.issues[0]?.message ??
          `O cabeçalho ${IF_MATCH_HEADER} deve ser numérico.`,
        instanciaSegura(request),
      );
    }

    const corpoParsed = reconhecerAlertaRequisicaoSchema.safeParse(request.body ?? {});
    if (!corpoParsed.success) {
      return enviarProblema(
        reply,
        400,
        "Corpo de reconhecimento inválido",
        corpoParsed.error.issues[0]?.message ?? "Corpo inválido.",
        instanciaSegura(request),
      );
    }

    const resultado = await acknowledgeAlert(db, {
      tenantId,
      actorId: atorId,
      workItemId: id,
      expectedVersion: ifMatchParsed.data,
      correlationId: String(request.id),
    });

    if (resultado.kind === "not-found") {
      return enviarProblema(
        reply,
        404,
        "Alerta não encontrado",
        "Nenhum alerta com este id neste tenant.",
        instanciaSegura(request),
      );
    }

    if (resultado.kind === "version-conflict") {
      const problema: ProblemDetailsConflitoVersao = {
        type: "about:blank",
        title: "Conflito de versão",
        status: 412,
        detail:
          "A versão informada em If-Match não confere com a versão corrente do alerta. Redecida com o estado corrente.",
        instance: instanciaSegura(request),
        versaoAtual: resultado.atual.versao,
        estadoAtual: resultado.atual.estado,
      };
      return reply.code(412).type(PROBLEM_JSON_MIME_TYPE).send(problema);
    }

    if (resultado.kind === "illegal-transition") {
      return enviarProblema(
        reply,
        409,
        "Transição inválida",
        `O alerta está no estado '${resultado.atual.estado}', que não admite a ação "reconhecer".`,
        instanciaSegura(request),
      );
    }

    // Escrita durável concluída: acorda as assinaturas do tenant.
    opcoes.notificador.notificarMudancaEm(tenantId);
    // Só a TRANSIÇÃO: a latência de `generated_to_acknowledged` já vem do
    // hook HTTP. De qual estado para qual estado o item foi é o sinal que o
    // limite HTTP não enxerga — um 200 não o revela.
    telemetria.transicaoDeItemDeTrabalho(resultado.estadoAnterior, "reconhecido");

    const resposta: ReconhecerAlertaResposta = { item: resultado.item };
    return reply.code(200).send(resposta);
  });

  // `GET /v1/eventos/stream` NÃO é registrada aqui. A rota anterior montava o
  // backlog em texto SSE e encerrava a conexão logo após o catch-up — chamar
  // isso de "tempo real" é o anti-padrão §10-11. A superfície passou a ser o
  // gateway de `apps/api/src/eventos/stream.ts`, registrado por `index.ts`,
  // que mantém a conexão aberta e reautoriza a cada evento. Duas rotas no
  // mesmo caminho fariam o Fastify falhar no registro. `replayEvents` continua
  // exportado de `db.ts` e é consumido pelo gateway via `criarFonteDeReplay`.

  registrarSessaoDeDesenvolvimento(app, opcoes.sessaoDeDesenvolvimento);
}

/**
 * `POST /v1/dev/sessao` — emite uma sessão SINTÉTICA de desenvolvimento.
 *
 * EXISTE APENAS onde o perfil admite adaptador sintético. Em perfil endurecido
 * `registro` é `undefined` e a rota não é registrada: a resposta é 404, não
 * 403. A diferença importa — 403 confirma a existência da superfície.
 *
 * NÃO ACEITA ENTRADA. Tenant e ator são os do cenário sintético semeado, lidos
 * de `@intensicare/fixtures-sinteticas`; nada vem do chamador. Um endpoint de
 * emissão que aceitasse `tenantId` do corpo seria uma máquina de fabricar
 * identidade para qualquer tenant — e o repositório inteiro é construído sobre
 * a premissa oposta (anti-padrão §10.3).
 *
 * O token emitido é VERIFICADO pela própria porta antes de sair: se o material
 * que acabamos de assinar não passa no verificador, nenhuma sessão é entregue.
 * É também de onde sai `expiraEm` — do `exp` da claim verificada, nunca de um
 * cálculo paralelo que pudesse divergir do token.
 */
function registrarSessaoDeDesenvolvimento(
  app: FastifyInstance,
  registro: SessaoDeDesenvolvimento | undefined,
): void {
  if (registro === undefined) return;

  const tenantSintetico = buildG7SyntheticScenario().organization.id;

  app.post("/v1/dev/sessao", async (request, reply) => {
    const emitir = registro.porta.emitirToken;
    if (emitir === undefined) {
      return enviarProblema(
        reply,
        503,
        "Emissão de sessão de desenvolvimento indisponível",
        "A porta de autenticação instalada não emite token. Nenhuma sessão foi criada.",
        instanciaSegura(request),
      );
    }

    const token = emitir(tenantSintetico, ATOR_SESSAO_DE_DESENVOLVIMENTO);
    const verificado = await registro.porta.autenticar({
      headers: { authorization: `Bearer ${token}` },
      id: String(request.id),
    });
    if (!verificado.ok) {
      return enviarProblema(
        reply,
        500,
        "Sessão de desenvolvimento não verificável",
        "O token emitido não passou no verificador desta instância; nenhuma sessão foi entregue.",
        instanciaSegura(request),
      );
    }

    reply.header("cache-control", "no-store");
    const corpo: SessaoDeDesenvolvimentoResposta = {
      token,
      expiraEm: new Date(verificado.contexto.expiraEm * 1000).toISOString(),
    };
    return reply.code(201).send(corpo);
  });
}

/** Corpo de `POST /v1/dev/sessao`. Dev-only — ver `registrarSessaoDeDesenvolvimento`. */
export interface SessaoDeDesenvolvimentoResposta {
  /** JWS compacto assinado pelo emissor sintético local deste processo. */
  readonly token: string;
  /** Instante de expiração (ISO 8601), lido do `exp` da claim verificada. */
  readonly expiraEm: string;
}
