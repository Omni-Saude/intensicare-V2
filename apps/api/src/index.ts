/**
 * apps/api — backend do IntensiCare V2.
 *
 * PREMISSA (reversível, GDEC-0015/0017): Fastify 5 + validação zod,
 * contrato de API contract-first (OpenAPI 3.1 — `packages/contratos/openapi.yaml`),
 * erros `application/problem+json` (RFC 9457) em pt-BR, idempotência de
 * escrita por cabeçalho `Idempotency-Key` COM hash do corpo e concorrência
 * otimista por cabeçalho `If-Match` (ver
 * `docs/06-architecture/premissas-de-construcao.md` PRE-04/PRE-05).
 *
 * SPR-G7-2 (INTEGRAÇÃO REAL): expõe a fatia vertical sintética de
 * `/v1/*` (`routes.ts`) — ingestão → persistência real
 * (`@intensicare/persistencia`, PGlite + RLS + outbox transacional) →
 * avaliação NEWS2 REAL (`@intensicare/kernel-clinico`) → status explícito
 * → alerta durável → projeção de grade de leitos lida do banco →
 * reconhecimento com concorrência segura → auditoria append-only. O banco
 * de dev/teste é semeado com as fixtures sintéticas
 * (`@intensicare/fixtures-sinteticas`, cenário G7). `GET /health` e
 * `POST /idempotency-example` (fundação SPR-G7-1) são mantidas por
 * compatibilidade com os testes de fundação existentes; não fazem parte
 * do contrato `/v1/*`.
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita.
 */
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { PGlite } from "@electric-sql/pglite";
import {
  IDEMPOTENCY_KEY_HEADER,
  PROBLEM_JSON_MIME_TYPE,
  type ProblemDetails,
} from "@intensicare/contratos";
import { prepareDatabase } from "./db.js";
import { registrarRotasV1 } from "./routes.js";

const healthResponseSchema = z.object({ status: z.literal("ok") });

const idempotencyHeaderSchema = z.object({
  [IDEMPOTENCY_KEY_HEADER.toLowerCase()]: z.string().min(1, {
    message: `O cabeçalho ${IDEMPOTENCY_KEY_HEADER} não pode ser vazio.`,
  }),
});

export interface BuildServerOptions {
  /**
   * Banco JÁ migrado (e, se desejado, já semeado) fornecido pelo chamador —
   * útil em teste E2E com semeadura própria. Sem esta opção, um PGlite em
   * memória novo é criado, migrado e semeado com as fixtures sintéticas.
   */
  readonly db?: PGlite;
}

/**
 * Constrói (mas não inicia) uma instância do servidor Fastify sobre a
 * persistência REAL. Separado de `listen()` para ser testável via
 * `app.inject(...)` sem abrir porta de rede real. Assíncrono porque
 * migra/semeia o banco antes de registrar as rotas.
 */
export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const db = await prepareDatabase(options.db);
  const app = Fastify({ logger: false });

  app.get("/health", async () => healthResponseSchema.parse({ status: "ok" }));

  // Rota de exemplo (fundação SPR-G7-1): demonstra a convenção de
  // idempotência de escrita e o envelope de erro — não é uma rota de
  // domínio; mantida apenas por compatibilidade com os testes existentes.
  app.post("/idempotency-example", async (request, reply) => {
    const parsed = idempotencyHeaderSchema.safeParse(request.headers);
    if (!parsed.success) {
      const problem: ProblemDetails = {
        type: "about:blank",
        title: "Cabeçalho de idempotência ausente",
        status: 400,
        detail: `O cabeçalho ${IDEMPOTENCY_KEY_HEADER} é obrigatório em rotas de escrita.`,
        instance: request.url,
      };
      return reply.code(400).type(PROBLEM_JSON_MIME_TYPE).send(problem);
    }
    return reply.code(201).send({ received: true });
  });

  registrarRotasV1(app, db);

  app.setErrorHandler((error, request, reply) => {
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Erro interno inesperado",
      status: 500,
      detail: "Falha inesperada ao processar a requisição.",
      instance: request.url,
    };
    app.log.error(error);
    reply.code(500).type(PROBLEM_JSON_MIME_TYPE).send(problem);
  });

  app.addHook("onClose", async () => {
    await db.close();
  });

  return app;
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const port = Number(process.env["PORT"] ?? 3000);
  buildServer()
    .then((app) =>
      app.listen({ port, host: "0.0.0.0" }).catch((error: unknown) => {
        app.log.error(error);
        process.exitCode = 1;
      }),
    )
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
