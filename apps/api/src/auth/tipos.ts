/**
 * apps/api/src/auth/tipos.ts — vocabulário da porta de autenticação.
 *
 * ADR-0015 (autenticação/sessão/identidade m2m, direção aceita GDEC-0016,
 * Opção A) exige um **contexto de identidade verificado** construível apenas
 * pelo verificador: código de aplicação não pode fabricá-lo (§4.1). Aqui
 * ficam esse contexto, a taxonomia de razões de recusa e a forma do
 * `problem+json` devolvido.
 *
 * Regra de vazamento (§8 V1 do ADR-0015; SEC-0015): a razão da recusa é
 * informação INTERNA (métrica, auditoria, teste). O corpo devolvido ao
 * chamador é sempre o mesmo por classe de status, para que a resposta não
 * seja um oráculo de qual verificação falhou.
 */

import type { ProblemDetails } from "@intensicare/contratos";

/**
 * Identidade de pessoa versus identidade de carga de trabalho (ADR-0015 D3,
 * SEC-0006): relay de outbox, trabalhadores de fundo e futura superfície MCP
 * têm sujeito próprio e NÃO recebem escopo de leitura clínica ampla.
 */
export type TipoIdentidade = "usuario" | "workload";

/**
 * Modelo de papéis mínimo da fatia G7, transcrito de ADR-0016 §4.1
 * (premissa reversível GDEC-0015/0017). Não é um modelo de papéis clínicos
 * definitivo — o ADR-0016 explicitamente NÃO vincula isso.
 */
export const PAPEIS_RECONHECIDOS = ["leitor-clinico", "atuante-clinico", "admin-tenant"] as const;
export type PapelClinico = (typeof PAPEIS_RECONHECIDOS)[number];

/**
 * Escopo que caracteriza a identidade de workload (concessão
 * client-credentials). PREMISSA (reversível, ADR-0015 §4.1): na ausência de
 * IdP selecionado, o marcador do fluxo m2m é este escopo; um IdP real pode
 * expor a distinção por outra claim, e o mapeamento vira configuração do
 * adaptador.
 */
export const ESCOPO_WORKLOAD = "m2m";

/**
 * Escopo de leitura clínica ampla — proibido para identidade de workload
 * (ADR-0015 §4.1: "nenhuma delas recebe escopo de leitura clínica ampla").
 */
export const ESCOPO_LEITURA_CLINICA_AMPLA = "clinico:leitura-ampla";

/** Prefixo do escopo que afirma o tenant a que a concessão se aplica. */
export const PREFIXO_ESCOPO_TENANT = "tenant:";

/**
 * Contexto de identidade VERIFICADO. Todo campo aqui vem de claim assinada
 * pelo emissor configurado — nunca de header, query string, corpo ou de
 * qualquer valor que o chamador possa escolher sem passar pela assinatura
 * (ADR-0015 §4 item 2; anti-padrão §10.3 do prompt).
 */
export interface ContextoAutenticado {
  /** Claim `tenant`. Nunca defaultada, nunca derivada de valor do chamador (SEC-0001). */
  readonly tenantId: string;
  /** Claim `sub`. É o ator para fins de auditoria (ADR-0018). */
  readonly atorId: string;
  readonly tipoIdentidade: TipoIdentidade;
  readonly papeis: readonly PapelClinico[];
  readonly escopos: readonly string[];
  /**
   * Claim `purpose` quando presente. O VOCABULÁRIO de finalidade é matéria de
   * privacidade (ADR-0015 §6, dono `AUTH-PRIVACY-LEGAL` UNASSIGNED) — este
   * módulo transporta a string opaca e não a interpreta. VALIDATION REQUIRED.
   */
  readonly finalidade: string | undefined;
  readonly emissor: string;
  /** `exp` em segundos desde a época — prazo da sessão. */
  readonly expiraEm: number;
  /** `jti` quando presente; base para revogação futura (não implementada). */
  readonly idSessao: string | undefined;
}

/**
 * Taxonomia interna de recusa. Mapeada para o status HTTP e NUNCA serializada
 * na resposta. `401` = não foi possível estabelecer identidade; `403` =
 * identidade estabelecida, mas a concessão não autoriza.
 */
export const CODIGOS_DE_FALHA = {
  // --- 401: identidade não estabelecida ---
  "cabecalho-ausente": 401,
  "esquema-invalido": 401,
  "token-vazio": 401,
  "formato-jws-invalido": 401,
  "cabecalho-jose-invalido": 401,
  "algoritmo-nao-permitido": 401,
  "parametro-crit-nao-suportado": 401,
  "kid-ausente": 401,
  "kid-desconhecido": 401,
  "familia-de-chave-incompativel": 401,
  "fonte-de-chaves-indisponivel": 401,
  "assinatura-invalida": 401,
  "payload-invalido": 401,
  "emissor-invalido": 401,
  "audiencia-invalida": 401,
  "expiracao-invalida": 401,
  "token-expirado": 401,
  "token-ainda-nao-valido": 401,
  "token-emitido-no-futuro": 401,
  "sujeito-ausente": 401,
  "tenant-ausente": 401,
  "tenant-malformado": 401,
  "escopo-ausente": 401,
  "porta-nao-instalada": 401,
  "configuracao-de-autenticacao-ausente": 401,
  "erro-inesperado-na-verificacao": 401,
  // --- 403: identidade estabelecida, concessão insuficiente ---
  "tenant-nao-autorizado": 403,
  "tenant-divergente-do-escopo": 403,
  "workload-com-escopo-clinico-amplo": 403,
} as const satisfies Record<string, 401 | 403>;

export type CodigoFalhaAutenticacao = keyof typeof CODIGOS_DE_FALHA;

/**
 * Corpo devolvido ao chamador. Uniforme por status — ver a "regra de
 * vazamento" no topo deste arquivo. Não contém tenant, sujeito, emissor,
 * token, `kid`, algoritmo nem qualquer pista de qual verificação falhou.
 */
const CORPO_POR_STATUS = {
  401: {
    title: "Não autenticado",
    detail: "Credencial de acesso ausente, inválida ou expirada.",
  },
  403: {
    title: "Acesso negado",
    detail: "A credencial apresentada não autoriza esta operação.",
  },
} as const;

export interface FalhaAutenticacao {
  /** Razão interna — para métrica de segurança (QAS-0014) e teste. Nunca serializada. */
  readonly codigo: CodigoFalhaAutenticacao;
  readonly status: 401 | 403;
  /** `instancia` deve vir de `instanciaSegura(request)` — jamais `request.url` (SAF-0026/SEC-0015). */
  problema(instancia: string): ProblemDetails;
}

export function falha(codigo: CodigoFalhaAutenticacao): FalhaAutenticacao {
  const status = CODIGOS_DE_FALHA[codigo];
  const corpo = CORPO_POR_STATUS[status];
  return {
    codigo,
    status,
    problema: (instancia: string): ProblemDetails => ({
      type: "about:blank",
      title: corpo.title,
      status,
      detail: corpo.detail,
      instance: instancia,
    }),
  };
}

/** Resultado do verificador — carrega a razão interna. */
export type ResultadoVerificacao =
  | { readonly ok: true; readonly contexto: ContextoAutenticado }
  | { readonly ok: false; readonly falha: FalhaAutenticacao };

/**
 * Resultado exposto às rotas. Forma preservada da fatia SPR-G7-2 para não
 * exigir mudança em `routes.ts`: `{ ok: true, contexto }` ou
 * `{ ok: false, problema }`.
 */
export type ResultadoAutenticacao =
  | { readonly ok: true; readonly contexto: ContextoAutenticado }
  | {
      readonly ok: false;
      readonly problema: ProblemDetails;
      /** Razão interna, para log/métrica. Nunca vai no corpo da resposta. */
      readonly codigo: CodigoFalhaAutenticacao;
    };

export function resultadoDeFalha(f: FalhaAutenticacao, instancia: string): ResultadoAutenticacao {
  return { ok: false, problema: f.problema(instancia), codigo: f.codigo };
}
