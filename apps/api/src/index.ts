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
 * (`@intensicare/fixtures-sinteticas`, cenário G7). `GET /health` é
 * mantida da fundação SPR-G7-1 por compatibilidade com os testes
 * existentes; não faz parte do contrato `/v1/*`.
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
import { instanciaSegura } from "./problema.js";
import { registrarRotasV1 } from "./routes.js";

const healthResponseSchema = z.object({ status: z.literal("ok") });

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

  // A rota de exemplo `POST /idempotency-example` da fundação SPR-G7-1 foi
  // REMOVIDA: aceitava escrita sem autenticação (ACHADO-03 da verificação
  // de controles da fatia G7 — `docs/11-security-privacy-compliance/
  // verificacao-de-controles-fatia-g7.md`). Superfície de escrita sem
  // authz é defeito mesmo quando não expõe estado clínico. A convenção de
  // idempotência que ela demonstrava está exercida na rota real
  // `POST /v1/ingestao/observacoes`, essa sim autenticada.

  registrarRotasV1(app, db);

  app.setErrorHandler((error, request, reply) => {
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Erro interno inesperado",
      status: 500,
      detail: "Falha inesperada ao processar a requisição.",
      // Nunca `request.url`: vaza identificador do sujeito no corpo do erro
      // (ACHADO-02; SAF-0026/SEC-0015). Ver `instanciaSegura` em problema.ts.
      instance: instanciaSegura(request),
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
