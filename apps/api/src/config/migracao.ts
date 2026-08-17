/**
 * Orquestração de migração de schema: exclusão mútua, tempo limite,
 * compatibilidade de versão e rollback/roll-forward.
 *
 * OBSERVED no estado atual: `packages/persistencia/src/session.ts::runMigrations`
 * aplica `0001_init.sql` e `0002_g7_integration.sql` em sequência, sempre, sem
 * lock, sem tabela de versão, sem tempo limite e sem qualquer reversão. Isso é
 * correto para um PGlite recém-criado por processo — e é exatamente o que não
 * pode ser transplantado para um banco compartilhado, onde dois processos
 * subindo juntos migram em paralelo. ADR-0019 §2.1 E2 exige "rodar migrações
 * com estratégia de rollback"; ADR-0020 §6 amarra migração ao restore ensaiado.
 *
 * PORTA, NÃO IMPLEMENTAÇÃO. Este módulo não conhece driver, SQL nem lock
 * consultivo: fala com `PortaMigracao`. O adaptador PostgreSQL real (agente
 * `ic-fronteira-postgres-rls`) é quem implementa. A separação não é estética —
 * é o que permite provar rollback, contenção de lock e expiração sem um banco,
 * e o que impede que uma conclusão obtida sob PGlite seja apresentada como
 * válida para PostgreSQL de produção (anti-padrão 6).
 *
 * O QUE ESTE MÓDULO NÃO FAZ, E NÃO SIMULA: backup. Restauração a partir de
 * backup verificado é PRÉ-CONDIÇÃO documentada para o caso irreversível, e
 * nada aqui cria, valida ou restaura backup — ADR-0020 §4 O6 ("restore que
 * nunca foi ensaiado não conta como backup"). Um teste que "simulasse" backup
 * produziria verde sobre uma capacidade inexistente.
 */
import type { ConfiguracaoRuntime } from "./esquema.js";
import type { Perfil } from "./perfis.js";
import type { ModoMigracao } from "./variaveis.js";

export const PRECONDICAO_BACKUP =
  "Recuperação exige restauração a partir de backup verificado — pré-condição " +
  "DOCUMENTADA e NÃO executável por este processo: nada neste código cria, valida " +
  "ou restaura backup (ADR-0020 §4 O6: restore que nunca foi ensaiado não conta " +
  "como backup). Acione o runbook de operação antes de qualquer nova tentativa.";

export interface PassoMigracao {
  /** Versão de schema que este passo instala. Estritamente crescente no plano. */
  readonly versao: number;
  readonly nome: string;
  /** Passo que remove ou reescreve dado/coluna existente (fase "contract"). */
  readonly destrutiva: boolean;
  /** Existe reversão determinística. `false` transforma falha em irreversível. */
  readonly reversivel: boolean;
}

/**
 * Interface MÍNIMA exigida do adaptador de banco. Declarada aqui porque
 * `@intensicare/persistencia` ainda não a expõe (verificado por
 * `grep -rni "advisory|lock|schema_version|rollback" packages/persistencia/src`,
 * sem resultado). Quando o adaptador real publicar a sua porta, esta declaração
 * deve ser substituída por um import — ver handoff.
 *
 * Contrato exigido do implementador:
 * - `adquirirLock` devolve `false` quando outro processo detém o lock; NÃO
 *   bloqueia indefinidamente por conta própria;
 * - `reverter` é IDEMPOTENTE: pode ser chamado para um passo cuja aplicação
 *   expirou e cujo efeito é desconhecido;
 * - o lock precisa ser liberado com a conexão, para que um processo morto não
 *   deixe migração travada para sempre.
 */
export interface PortaMigracao {
  adquirirLock(lockId: number, timeoutMs: number): Promise<boolean>;
  liberarLock(lockId: number): Promise<void>;
  versaoAplicada(): Promise<number>;
  aplicar(passo: PassoMigracao): Promise<void>;
  reverter(passo: PassoMigracao): Promise<void>;
}

export interface PlanoMigracao {
  readonly perfil: Perfil;
  readonly modo: ModoMigracao;
  readonly passos: readonly PassoMigracao[];
  readonly versaoExigidaPeloCodigo: number;
  readonly lockId: number;
  readonly timeoutMs: number;
  readonly permitirDestrutiva: boolean;
  readonly janelaCompatibilidade: number;
}

export type ResultadoMigracao =
  | { readonly desfecho: "sem-mudanca"; readonly versao: number }
  | {
      readonly desfecho: "aplicada";
      readonly de: number;
      readonly para: number;
      readonly passos: readonly number[];
    }
  | { readonly desfecho: "lock-indisponivel"; readonly motivo: "ocupado" | "tempo-esgotado" }
  | {
      readonly desfecho: "incompativel";
      readonly versaoNoBanco: number;
      readonly versaoExigida: number;
      readonly motivo: string;
    }
  | {
      readonly desfecho: "revertida";
      readonly causa: string;
      readonly revertidos: readonly number[];
    }
  | {
      readonly desfecho: "falha-irreversivel";
      readonly causa: string;
      readonly precondicaoBackup: string;
    };

export interface VeredictoCompatibilidade {
  readonly veredito: "em-dia" | "pendente" | "incompativel";
  readonly motivo: string;
}

/**
 * Compara a versão de schema no banco com a exigida pelo código.
 *
 * O caso perigoso é o banco estar À FRENTE: acontece toda vez que um rollback
 * de aplicação é feito sem rollback de schema, e o sintoma não é um erro claro
 * — é um `select` que devolve coluna a menos e um caminho clínico degradando
 * em silêncio. Recusar o boot é a resposta correta.
 */
export function verificarCompatibilidade(
  versaoNoBanco: number,
  versaoExigida: number,
  janela: number,
): VeredictoCompatibilidade {
  if (versaoNoBanco > versaoExigida) {
    return {
      veredito: "incompativel",
      motivo:
        "o schema do banco está à frente da versão exigida por este código: " +
        "implantação antiga contra schema novo. Promova a versão correta do código " +
        "ou reverta o schema deliberadamente — este processo não adivinha.",
    };
  }
  if (versaoNoBanco === versaoExigida) {
    return { veredito: "em-dia", motivo: "schema na versão exigida." };
  }
  if (versaoExigida - versaoNoBanco > janela) {
    return {
      veredito: "incompativel",
      motivo:
        "defasagem de schema maior que a janela de compatibilidade configurada — " +
        "indica implantação pulada. Migre por etapas em vez de saltar versões.",
    };
  }
  return { veredito: "pendente", motivo: "há migração pendente dentro da janela." };
}

interface Concluido<T> {
  readonly ok: true;
  readonly valor: T;
}
interface Expirado {
  readonly ok: false;
}

/** Corrida entre a promessa e um temporizador. O temporizador é sempre limpo. */
async function comTempoLimite<T>(
  promessa: Promise<T>,
  ms: number,
): Promise<Concluido<T> | Expirado> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const expiracao = new Promise<Expirado>((resolve) => {
    temporizador = setTimeout(() => resolve({ ok: false }), ms);
  });
  try {
    return await Promise.race([
      promessa.then((valor): Concluido<T> => ({ ok: true, valor })),
      expiracao,
    ]);
  } finally {
    if (temporizador !== undefined) clearTimeout(temporizador);
  }
}

/**
 * Reverte, em ordem inversa, TODOS os passos envolvidos — inclusive aquele em
 * que a falha ocorreu. Um passo cuja aplicação expirou tem efeito DESCONHECIDO,
 * e tratar desconhecido como "não aplicado" é como se deixa meia migração no
 * banco. Por isso `reverter` precisa ser idempotente do lado do adaptador.
 */
async function reverterTudo(
  porta: PortaMigracao,
  envolvidos: readonly PassoMigracao[],
  causa: string,
): Promise<ResultadoMigracao> {
  const ordem = [...envolvidos].reverse();
  const irreversivel = ordem.find((passo) => !passo.reversivel);
  if (irreversivel !== undefined) {
    return {
      desfecho: "falha-irreversivel",
      causa: `${causa}; o passo ${irreversivel.nome} não declara reversão determinística`,
      precondicaoBackup: PRECONDICAO_BACKUP,
    };
  }
  const revertidos: number[] = [];
  for (const passo of ordem) {
    try {
      await porta.reverter(passo);
    } catch {
      return {
        desfecho: "falha-irreversivel",
        causa: `${causa}; a reversão do passo ${passo.nome} falhou`,
        precondicaoBackup: PRECONDICAO_BACKUP,
      };
    }
    revertidos.push(passo.versao);
  }
  return { desfecho: "revertida", causa, revertidos };
}

/**
 * Executa (ou apenas verifica) a migração. Nunca lança: todo desfecho é um
 * valor do tipo `ResultadoMigracao`, para que o bootstrap decida o que fazer
 * com cada um — um `throw` genérico aqui viraria "falhou ao subir" no log e
 * apagaria a diferença entre "outro processo está migrando" e "o schema está
 * à frente do código", que pedem reações opostas.
 */
export async function executarMigracao(
  porta: PortaMigracao,
  plano: PlanoMigracao,
): Promise<ResultadoMigracao> {
  const versaoNoBanco = await porta.versaoAplicada();
  const versaoExigida = plano.versaoExigidaPeloCodigo;
  const compat = verificarCompatibilidade(
    versaoNoBanco,
    versaoExigida,
    plano.janelaCompatibilidade,
  );

  if (compat.veredito === "incompativel") {
    return { desfecho: "incompativel", versaoNoBanco, versaoExigida, motivo: compat.motivo };
  }
  if (compat.veredito === "em-dia") {
    return { desfecho: "sem-mudanca", versao: versaoNoBanco };
  }

  const pendentes = plano.passos
    .filter((passo) => passo.versao > versaoNoBanco && passo.versao <= versaoExigida)
    .sort((a, b) => a.versao - b.versao);

  if (plano.modo === "verificar") {
    return {
      desfecho: "incompativel",
      versaoNoBanco,
      versaoExigida,
      motivo:
        `há ${pendentes.length} migração(ões) pendente(s) e o modo configurado é ` +
        `"verificar" (perfil ${plano.perfil}): este processo não altera schema. ` +
        "Rode a migração como passo próprio da implantação.",
    };
  }

  const destrutivos = pendentes.filter((passo) => passo.destrutiva);
  if (destrutivos.length > 0 && !plano.permitirDestrutiva) {
    return {
      desfecho: "incompativel",
      versaoNoBanco,
      versaoExigida,
      motivo:
        `passo destrutivo pendente (${destrutivos.map((p) => p.nome).join(", ")}) sem ` +
        "autorização explícita: defina IC_MIGRACAO_PERMITIR_DESTRUTIVA=sim e assegure " +
        "antes a pré-condição de backup verificado. " +
        PRECONDICAO_BACKUP,
    };
  }

  const lock = await comTempoLimite(
    porta.adquirirLock(plano.lockId, plano.timeoutMs),
    plano.timeoutMs,
  );
  if (!lock.ok) {
    // Expirou a AQUISIÇÃO: pode ser que o lock nunca tenha sido nosso. Liberar
    // aqui arriscaria derrubar o lock de quem está legitimamente migrando.
    return { desfecho: "lock-indisponivel", motivo: "tempo-esgotado" };
  }
  if (!lock.valor) {
    return { desfecho: "lock-indisponivel", motivo: "ocupado" };
  }

  const envolvidos: PassoMigracao[] = [];
  try {
    for (const passo of pendentes) {
      envolvidos.push(passo);
      let aplicado = false;
      try {
        const resultado = await comTempoLimite(porta.aplicar(passo), plano.timeoutMs);
        aplicado = resultado.ok;
      } catch {
        // A mensagem do driver NÃO é propagada: erro de banco pode carregar
        // trecho de linha ou de parâmetro (anti-padrão 12). O nome do passo é
        // constante de código e basta para diagnosticar.
        aplicado = false;
      }
      if (!aplicado) {
        return await reverterTudo(
          porta,
          envolvidos,
          `falha ou tempo esgotado ao aplicar ${passo.nome}`,
        );
      }
    }
    return {
      desfecho: "aplicada",
      de: versaoNoBanco,
      para: versaoExigida,
      passos: pendentes.map((passo) => passo.versao),
    };
  } finally {
    await porta.liberarLock(plano.lockId);
  }
}

/** Constrói o plano a partir da configuração já validada — atalho de fiação. */
export function planoDeMigracao(
  config: ConfiguracaoRuntime,
  passos: readonly PassoMigracao[],
  versaoExigidaPeloCodigo: number,
): PlanoMigracao {
  return {
    perfil: config.perfil,
    modo: config.migracao.modo,
    passos,
    versaoExigidaPeloCodigo,
    lockId: config.migracao.lockId,
    timeoutMs: config.migracao.timeoutMs,
    permitirDestrutiva: config.migracao.permitirDestrutiva,
    janelaCompatibilidade: config.migracao.janelaCompatibilidade,
  };
}
