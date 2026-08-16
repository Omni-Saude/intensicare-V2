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
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import type { PGlite } from "@electric-sql/pglite";
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  IF_MATCH_HEADER,
  PROBLEM_JSON_MIME_TYPE,
  type AvaliacoesPacienteResposta,
  type GradeLeitosResposta,
  type HealthzResposta,
  type ObservacaoEmQuarentena,
  type ObservacaoEntrada,
  type ProblemDetails,
  type ProblemDetailsConflitoVersao,
  type ReconhecerAlertaResposta,
} from "@intensicare/contratos";
import { checkConnection } from "@intensicare/persistencia";
import { autenticar } from "./auth.js";
import { instanciaSegura } from "./problema.js";
import {
  acknowledgeAlert,
  getPatientEvaluations,
  hashRequestBody,
  ingestObservations,
  projectBedGrid,
  replayEvents,
} from "./db.js";
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

export function registrarRotasV1(app: FastifyInstance, db: PGlite): void {
  // Correlação: ecoa o id interno de requisição do Fastify como
  // cabeçalho de resposta, para toda rota (prompt §12.1 — IDs de
  // correlação/causação nas convenções de contrato de API).
  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-correlation-id", request.id);
    return payload;
  });

  app.get("/v1/healthz", async () => {
    await checkConnection(db);
    const resposta: HealthzResposta = { status: "ok" };
    return resposta;
  });

  app.post("/v1/ingestao/observacoes", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const idempKeyParsed = idempotencyKeyHeaderSchema.safeParse(
      primeiroValor(request.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()]),
    );
    if (!idempKeyParsed.success) {
      return enviarProblema(
        reply,
        400,
        "Cabeçalho de idempotência ausente ou inválido",
        idempKeyParsed.error.issues[0]?.message ?? `O cabeçalho ${IDEMPOTENCY_KEY_HEADER} é obrigatório.`,
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
        reply.header(IDEMPOTENCY_REPLAYED_HEADER, "true");
        return reply.code(resultado.statusCode).send(resultado.body);
      case "key-conflict":
        return enviarProblema(
          reply,
          422,
          "Reuso de Idempotency-Key com corpo divergente",
          "Esta Idempotency-Key já foi usada com um corpo de requisição diferente. Reenvie o corpo original para obter a resposta original, ou use uma chave nova para uma nova escrita (draft IETF idempotency-key-header).",
          instanciaSegura(request),
        );
      case "encounter-not-found":
        return enviarProblema(
          reply,
          404,
          "Encontro não encontrado",
          "Nenhum encontro ativo com este id neste tenant.",
          instanciaSegura(request),
        );
      case "mismatch":
        return enviarProblema(reply, 422, "Envelope incoerente com o encontro", resultado.detail, instanciaSegura(request));
      case "created":
        reply.header(IDEMPOTENCY_REPLAYED_HEADER, "false");
        return reply.code(201).send(resultado.body);
    }
  });

  app.get("/v1/projecoes/grade-leitos", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const leitos = await projectBedGrid(db, {
      tenantId,
      actorId: atorId,
      correlationId: String(request.id),
    });
    const resposta: GradeLeitosResposta = { leitos };
    return reply.code(200).send(resposta);
  });

  app.get("/v1/pacientes/:pacienteRef/avaliacoes", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const { pacienteRef } = request.params as { pacienteRef: string };
    const avaliacoes = await getPatientEvaluations(db, {
      tenantId,
      actorId: atorId,
      pacienteRef,
      correlationId: String(request.id),
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

    const resposta: AvaliacoesPacienteResposta = { pacienteRef, avaliacoes };
    return reply.code(200).send(resposta);
  });

  app.post("/v1/alertas/:id/reconhecer", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(auth.problema);
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
        ifMatchParsed.error.issues[0]?.message ?? `O cabeçalho ${IF_MATCH_HEADER} deve ser numérico.`,
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
      return enviarProblema(reply, 404, "Alerta não encontrado", "Nenhum alerta com este id neste tenant.", instanciaSegura(request));
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

    const resposta: ReconhecerAlertaResposta = { item: resultado.item };
    return reply.code(200).send(resposta);
  });

  const cursorQuerySchema = z.object({
    cursor: z.coerce.number().int().min(0).optional(),
  });

  app.get("/v1/eventos/stream", async (request, reply) => {
    const auth = autenticar(request);
    if (!auth.ok) return reply.code(401).type(PROBLEM_JSON_MIME_TYPE).send(auth.problema);
    const { tenantId, atorId } = auth.contexto;

    const queryParsed = cursorQuerySchema.safeParse(request.query);
    const cursor = queryParsed.success ? (queryParsed.data.cursor ?? 0) : 0;

    const eventos = await replayEvents(db, {
      tenantId,
      actorId: atorId,
      cursor,
      correlationId: String(request.id),
    });

    // NOTA (pendência registrada em openapi.yaml x-pendencias e no README):
    // isto é replay de backlog por cursor, não push contínuo em conexão
    // aberta — a conexão é encerrada logo após o catch-up.
    const corpo = eventos
      .map((evento) => `id: ${String(evento.sequencia)}\nevent: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`)
      .join("");

    reply.header("content-type", "text/event-stream");
    reply.header("cache-control", "no-cache");
    return reply.code(200).send(corpo || `: sem eventos novos desde o cursor ${String(cursor)}\n\n`);
  });
}
