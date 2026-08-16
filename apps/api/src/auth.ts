/**
 * apps/api/src/auth.ts — stub de autenticação bearer sintética.
 *
 * PREMISSA (reversível, GDEC-0015/0017): ADR-0015 (autenticação/sessão/
 * identidade m2m) está `not-started`; este arquivo implementa apenas um
 * stub suficiente para exercitar, nesta fatia, a regra dura de escopo de
 * tenant obrigatório em toda consulta (prompt §3 regra 6; ADR-0011 P2/P3) —
 * **não é** um mecanismo de autenticação real. Não há verificação
 * criptográfica de token, não há emissão/expiração/revogação de sessão.
 *
 * Formato do token sintético: `SYNTH-TOKEN.<tenantId>.<atorId>`, onde
 * `tenantId` e `atorId` seguem a convenção `SYNTH-` da política de dados
 * sintéticos (GDEC-0014;
 * `docs/14-devsecops-and-delivery/politica-dados-sinteticos.md`). Qualquer
 * outro formato é rejeitado.
 *
 * // INTEGRAÇÃO PENDENTE (fatia): substituir por verificação real de
 * // sessão/identidade quando ADR-0015 for redigido/aceito.
 */
import type { FastifyRequest } from "fastify";
import type { ProblemDetails } from "@intensicare/contratos";

export interface ContextoAutenticado {
  tenantId: string;
  atorId: string;
}

const TOKEN_PATTERN = /^SYNTH-TOKEN\.([^.\s]+)\.([^.\s]+)$/;

/** Gera um token sintético válido para uso em testes e exemplos. */
export function gerarTokenSintetico(tenantId: string, atorId: string): string {
  return `SYNTH-TOKEN.${tenantId}.${atorId}`;
}

export type ResultadoAutenticacao =
  | { ok: true; contexto: ContextoAutenticado }
  | { ok: false; problema: ProblemDetails };

/**
 * Extrai e "verifica" (no sentido de forma, não de criptografia — ver
 * aviso acima) o contexto de tenant/ator a partir do cabeçalho
 * `Authorization: Bearer <token>`. Nunca aceita tenant vindo de qualquer
 * outro lugar (query string, corpo, cabeçalho customizado) — regra dura
 * §3-6 do prompt: contexto de tenant jamais inferido de valor arbitrário
 * do chamador sem verificação centralizada nesta função.
 */
export function autenticar(request: FastifyRequest): ResultadoAutenticacao {
  const cabecalho = request.headers["authorization"];
  const valor = Array.isArray(cabecalho) ? cabecalho[0] : cabecalho;

  if (!valor || !valor.startsWith("Bearer ")) {
    return {
      ok: false,
      problema: {
        type: "about:blank",
        title: "Não autenticado",
        status: 401,
        detail: "Cabeçalho Authorization com token bearer sintético é obrigatório.",
        instance: request.url,
      },
    };
  }

  const token = valor.slice("Bearer ".length).trim();
  const match = TOKEN_PATTERN.exec(token);
  if (!match) {
    return {
      ok: false,
      problema: {
        type: "about:blank",
        title: "Token sintético malformado",
        status: 401,
        detail: "O token bearer não está no formato SYNTH-TOKEN.<tenantId>.<atorId>.",
        instance: request.url,
      },
    };
  }

  const tenantId = match[1];
  const atorId = match[2];
  if (!tenantId || !atorId) {
    return {
      ok: false,
      problema: {
        type: "about:blank",
        title: "Token sintético malformado",
        status: 401,
        detail: "O token bearer não está no formato SYNTH-TOKEN.<tenantId>.<atorId>.",
        instance: request.url,
      },
    };
  }

  return { ok: true, contexto: { tenantId, atorId } };
}
