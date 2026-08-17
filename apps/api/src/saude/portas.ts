/**
 * apps/api/src/saude/portas.ts — PORTAS de prontidão exigidas por `apps/api`.
 *
 * SOURCE (ADR-0020 O4): "Sondas de prontidão verificam capacidade segura —
 * bundle de regras carregado e íntegro (ADR-0007), dependências obrigatórias,
 * frescor de projeção, identidade/chaves obrigatórias (fail-closed, §15.2) —
 * e não apenas liveness de processo."
 *
 * Por que PORTAS e não imports diretos
 * ------------------------------------
 * Os provedores destes fatos (perfil de runtime, identidade/chaves, bundle de
 * regra, banco) são construídos por outras unidades. Se este módulo importasse
 * cada uma delas, a superfície de prontidão passaria a depender da ordem em
 * que essas unidades existem — e ficaria intestável isoladamente. Aqui a
 * prontidão declara o MÍNIMO que exige; quem tem o fato implementa a porta.
 * As quatro portas abaixo são o contrato de integração declarado no handoff.
 *
 * O que este módulo NÃO faz
 * --------------------------
 * Não define limite de frescor, banda aceitável, alvo de latência ou de
 * disponibilidade. `limiteMs: null` é o estado honesto de hoje (ADR-0020 D2:
 * nenhuma meta numérica é decidida em código; Gate G1 é o ato humano que a
 * valida) e o avaliador de `packages/observabilidade/src/readiness.ts` trata
 * `null` como impedimento a `ready`, não como "sem limite".
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este módulo.
 */
import type { PGlite } from "@electric-sql/pglite";
import {
  type ActiveDegradation,
  assertNoPhiShape,
  type ProjectionLabel,
  type RuleAvailability,
  TelemetryRedactionError,
} from "@intensicare/observabilidade";
import { checkConnection } from "@intensicare/persistencia";

// ---------------------------------------------------------------------------
// Identificador de dependência — nome de subsistema, nunca um endereço
// ---------------------------------------------------------------------------

/**
 * Formas ENDEREÇÁVEIS recusadas em um id de dependência. `/v1/readyz` é uma
 * superfície não autenticada (ver `rotas.ts`): um id como
 * `postgres://usuario:senha@host/db` transformaria a resposta de prontidão em
 * divulgação de topologia e credencial. O id existe para dizer QUE subsistema
 * faltou, não ONDE ele está.
 */
const FORMA_ENDERECAVEL = /:\/\/|@|\bsenha\b|\bpassword\b|\bsecret\b|\btoken\b/i;

/**
 * Recusa ids inseguros. Reaproveita `assertNoPhiShape` de
 * `@intensicare/observabilidade` (a mesma varredura que a telemetria aplica),
 * porque o id chega a `detalhePt` e daí à resposta HTTP — a fronteira é a
 * mesma, e duplicar a lista de formas de PHI aqui seria criar uma segunda
 * verdade que envelheceria sozinha.
 */
export function assertIdDeDependenciaSeguro(id: string): void {
  if (id.trim().length === 0) {
    throw new TelemetryRedactionError(
      "forbidden_attribute_key",
      "id de dependência vazio — a razão de não prontidão precisa nomear o subsistema",
    );
  }
  if (FORMA_ENDERECAVEL.test(id)) {
    throw new TelemetryRedactionError(
      "phi_shaped_value",
      "id de dependência com forma endereçável (URI, credencial ou host) — " +
        "a superfície de prontidão nomeia o subsistema, jamais o endereço",
    );
  }
  assertNoPhiShape(id, "dependency.id");
}

// ---------------------------------------------------------------------------
// Portas
// ---------------------------------------------------------------------------

/**
 * Dependência verificável. `obrigatoria: true` ⇒ indisponibilidade bloqueia a
 * prontidão (`not_ready`); `false` ⇒ degrada (`degraded`). A distinção é do
 * provedor da porta, não deste módulo.
 */
export interface DependenciaDeclarada {
  readonly id: string;
  readonly obrigatoria: boolean;
  /** Nunca deve lançar para fora; se lançar, o coletor trata como indisponível. */
  readonly verificar: () => Promise<boolean> | boolean;
}

/**
 * Porta de `ic-identidade-auth` (`apps/api/src/auth/**`). Um booleano de
 * propósito: prontidão precisa saber se identidade e chaves estão
 * configuradas, e NÃO precisa (nem deve) ver qual chave, qual emissor ou
 * qual segredo.
 */
export interface PortaIdentidade {
  readonly configurada: () => boolean;
}

/** Porta de `ic-regras-bundle` (`apps/api/src/regras/**`), ADR-0007. */
export interface PortaBundleRegras {
  readonly disponibilidades: () => readonly RuleAvailability[];
}

/**
 * Porta de `ic-runtime-perfis` (`apps/api/src/config/**`). Só o FATO que a
 * prontidão consome: o perfil ativo serve exclusivamente dado sintético. O
 * NOME do perfil não entra aqui de propósito — ele viraria texto livre em uma
 * resposta pública e, se fosse para telemetria, seria recusado pelo
 * vocabulário fechado de `redaction.ts`.
 */
export interface PortaPerfilRuntime {
  readonly somenteSintetico: () => boolean;
}

/** Frescor declarado de uma projeção de leitura (ADR-0011 P5). */
export interface FrescorProjecaoDeclarado {
  readonly projecao: ProjectionLabel;
  /**
   * Lag medido em ms. `null` = NÃO MEDIDO nesta fatia — que não é o mesmo que
   * zero. Só é lido quando `limiteMs` é um número; ver a invariante abaixo.
   */
  readonly lagMsMedido: number | null;
  /** Limite aceitável em ms. `null` = **VALIDATION REQUIRED** (Gate G1). */
  readonly limiteMs: number | null;
}

export interface PortaProjecoes {
  readonly frescor: () => readonly FrescorProjecaoDeclarado[];
}

/** Conjunto completo de portas que a superfície de prontidão exige. */
export interface PortasDeProntidao {
  readonly dependencias: readonly DependenciaDeclarada[];
  readonly identidade: PortaIdentidade;
  readonly regras: PortaBundleRegras;
  readonly perfil: PortaPerfilRuntime;
  readonly projecoes: PortaProjecoes;
  readonly degradacoes: () => readonly ActiveDegradation[];
}

// ---------------------------------------------------------------------------
// Adaptadores concretos que esta fatia já consegue fornecer
// ---------------------------------------------------------------------------

/** Id do subsistema de persistência na superfície de prontidão. */
export const ID_DEPENDENCIA_BANCO = "banco-de-dados";

/**
 * Adaptador da dependência obrigatória de banco sobre o `checkConnection` REAL
 * de `@intensicare/persistencia` (`select 1`). Obrigatória porque toda leitura
 * e toda escrita clínica desta fatia passam pelo banco: sem ele não existe
 * capacidade segura, existe processo vivo — que é o que a liveness reporta.
 */
export function dependenciaDeBancoDeDados(db: PGlite): DependenciaDeclarada {
  assertIdDeDependenciaSeguro(ID_DEPENDENCIA_BANCO);
  return {
    id: ID_DEPENDENCIA_BANCO,
    obrigatoria: true,
    verificar: () => checkConnection(db),
  };
}

/**
 * Variante DIFERIDA da dependência de banco, para a fiação de `buildServer`.
 *
 * Existe por uma razão de ordem que não é cosmética: para que `/v1/startupz`
 * signifique alguma coisa, as superfícies de saúde precisam ser registradas
 * ANTES de `await prepareDatabase(...)` — caso contrário o processo só passa a
 * responder quando a inicialização já terminou, e a sonda de startup nunca
 * observa o estado `iniciando`. Mas nesse instante o `PGlite` ainda não
 * existe. Aqui o banco é lido por closure a cada verificação: enquanto
 * `obter()` devolve `null`, a dependência obrigatória está INDISPONÍVEL — que
 * é a leitura correta, e não um "ainda não sei" tratado como disponível.
 */
export function dependenciaDeBancoDeDadosDiferida(
  obter: () => PGlite | null,
): DependenciaDeclarada {
  assertIdDeDependenciaSeguro(ID_DEPENDENCIA_BANCO);
  return {
    id: ID_DEPENDENCIA_BANCO,
    obrigatoria: true,
    verificar: () => {
      const db = obter();
      return db === null ? false : checkConnection(db);
    },
  };
}

/**
 * Id da dependência que representa a fonte clínica REAL. Em perfil sintético
 * ela é declarada como opcional e indisponível: é exatamente isso que o perfil
 * sintético significa, e é o que faz a prontidão parar em `degraded` em vez de
 * anunciar `ready` (estado factual imutável — 100% sintético, prefixo
 * `SYNTH-`; a fatia não é release de produção).
 */
export const ID_DEPENDENCIA_FONTE_CLINICA_REAL = "fonte-clinica-real";

export function dependenciaDeFonteClinicaReal(disponivel: boolean): DependenciaDeclarada {
  assertIdDeDependenciaSeguro(ID_DEPENDENCIA_FONTE_CLINICA_REAL);
  return {
    id: ID_DEPENDENCIA_FONTE_CLINICA_REAL,
    obrigatoria: false,
    verificar: () => disponivel,
  };
}

/**
 * Declaração de frescor das projeções que esta fatia expõe, com limite
 * `null` (VALIDATION REQUIRED). Existe como função nomeada para que a
 * ausência de alvo seja uma declaração explícita e localizável — não a
 * ausência de uma linha que ninguém escreveu.
 */
export function frescorDeclaradoSemAlvoValidado(
  projecoes: readonly ProjectionLabel[],
): readonly FrescorProjecaoDeclarado[] {
  return projecoes.map((projecao) => ({ projecao, lagMsMedido: null, limiteMs: null }));
}
