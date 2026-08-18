/**
 * Bootstrap de sessão: migração, contexto de tenant por transação e — SOMENTE
 * no simulador PGlite — rebaixamento de papel.
 *
 * QUAL É A FRONTEIRA DE VERDADE (leia isto antes de usar qualquer coisa daqui)
 * ---------------------------------------------------------------------------
 * O isolamento por tenant só é uma FRONTEIRA DE SEGURANÇA quando a aplicação
 * se AUTENTICA já como papel sem privilégio contra um PostgreSQL real. Essa
 * topologia vive em `./postgres/` (`AdaptadorPostgres`, papéis separados de
 * migração e de aplicação, migração `0003_fronteira_papeis.sql`) e é
 * exercitada contra servidor real e efêmero em
 * `./postgres/fronteira-postgres.test.ts`.
 *
 * O que este arquivo oferece para PGlite é um SIMULADOR rotulado, não uma
 * fronteira: sob PGlite a conexão é única e o usuário autenticado é
 * superusuário, então `downgradeToApplicationRole` é reversível por
 * `SET SESSION AUTHORIZATION` (ACHADO-01, ADR-0016 §4.1, THR-0050 P0). Isso é
 * limitação do simulador, e está registrada como tal — não como controle.
 *
 * PREMISSA (reversível, GDEC-0015/0017 — OBSERVED por sondagem manual contra
 * PGlite 0.5.5, que embarca PostgreSQL 18.3): `SET LOCAL SESSION AUTHORIZATION`
 * e `SET LOCAL ROLE`, dentro de `db.transaction(...)`, NÃO revertem ao
 * encerrar a transação nessa versão — divergência do PostgreSQL padrão. Por
 * isso o rebaixamento aqui é de escopo de SESSÃO e permanente: migrações
 * rodam primeiro, com superusuário; depois a conexão é rebaixada uma única vez.
 * O escopo por tenant, que precisa mesmo variar por transação, usa
 * `set_config('app.tenant_id', ..., true)` — esse reset no commit/rollback FOI
 * verificado como correto na mesma sondagem, e é o mesmo mecanismo usado pelo
 * adaptador de PostgreSQL real.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PGlite, Transaction } from "@electric-sql/pglite";
import type { PortaBancoDeDados } from "./postgres/porta.js";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(MODULE_DIR, "migrations");

/** Nome do papel de aplicação sem privilégio de superusuário (ver 0001_init.sql). */
export const APPLICATION_ROLE = "intensicare_app" as const;

/**
 * Ordem de aplicação das migrações SQL puras. Fonte única: o provisionamento
 * de PostgreSQL real (`./postgres/provisionamento.ts`) lê a MESMA lista, para
 * que simulador e servidor real nunca divirjam de esquema.
 */
export const ARQUIVOS_DE_MIGRACAO = [
  "0001_init.sql",
  "0002_g7_integration.sql",
  "0003_fronteira_papeis.sql",
  "0004_escopo_selado.sql",
  "0005_fecho_de_privilegio.sql",
  "0006_ancora_isolada.sql",
] as const;

/**
 * A migração que precisa de um SEGUNDO passe, com credencial de SUPERUSUÁRIO.
 *
 * A `0006` faz duas coisas que o papel de migração NÃO pode fazer por desenho
 * (`0003`: sem `CREATEROLE`, sem `SUPERUSER`): criar o papel guardião da âncora
 * de escopo e criar o `EVENT TRIGGER` que fecha a janela de DDL entre boots.
 * Aplicada pelo migrador ela só registra `notice`; aplicada pelo superusuário
 * ela faz o trabalho. É idempotente nos dois passes.
 *
 * Quem orquestra os dois passes é `./postgres/provisionamento.ts`. Sob o
 * SIMULADOR PGlite as migrações já rodam como superusuário, então o passe único
 * basta — e a guarda de DDL não é instalada lá, porque ela é pedida
 * explicitamente por parâmetro (`intensicare.instalar_guarda_ddl`).
 */
export const MIGRACAO_COM_PASSE_DE_SUPERUSUARIO = "0006_ancora_isolada.sql" as const;

export interface MigracaoLida {
  readonly nome: string;
  readonly sql: string;
}

/**
 * Lê as migrações em ordem. `ate` (inclusive) limita a leitura — usado para
 * reproduzir o estado de um banco ANTERIOR e depois exercitar a atualização.
 */
export function lerMigracoes(ate?: string): readonly MigracaoLida[] {
  const nomes: string[] = [];
  for (const nome of ARQUIVOS_DE_MIGRACAO) {
    nomes.push(nome);
    if (ate !== undefined && nome === ate) {
      break;
    }
  }
  if (
    ate !== undefined &&
    !ARQUIVOS_DE_MIGRACAO.includes(ate as (typeof ARQUIVOS_DE_MIGRACAO)[number])
  ) {
    throw new Error(
      `migração desconhecida: '${ate}' (conhecidas: ${ARQUIVOS_DE_MIGRACAO.join(", ")})`,
    );
  }
  return nomes.map((nome) => ({
    nome,
    sql: readFileSync(join(MIGRATIONS_DIR, nome), "utf-8"),
  }));
}

/**
 * Aplica as migrações SQL puras, nesta ordem, contra um PGlite recém criado.
 * Deve rodar ANTES de `downgradeToApplicationRole` — as migrações exigem
 * privilégio de superusuário (criação de papel, RLS, triggers, grants).
 */
export async function runMigrations(db: PGlite): Promise<void> {
  for (const migracao of lerMigracoes()) {
    await db.exec(migracao.sql);
  }
}

/**
 * Rebaixa PERMANENTEMENTE a conexão do SIMULADOR para o papel de aplicação.
 *
 * NÃO É UM CONTROLE DE SEGURANÇA. Sob PGlite o usuário autenticado continua
 * sendo superusuário, e `SET SESSION AUTHORIZATION` desfaz este rebaixamento
 * (ACHADO-01). Serve para que o código de desenvolvimento exercite os mesmos
 * caminhos de RLS que rodarão em produção — a fronteira de verdade é o
 * `AdaptadorPostgres`, que se AUTENTICA como o papel sem privilégio.
 */
export async function downgradeToApplicationRole(db: PGlite): Promise<void> {
  await db.exec(`set session authorization ${APPLICATION_ROLE};`);
}

/**
 * Atalho de bootstrap para desenvolvimento/teste: migra e rebaixa a conexão
 * do simulador numa só chamada. Depois de chamar isto, `db` só deve ser usado
 * através de `withTenantTransaction`.
 */
export async function bootstrapDatabase(db: PGlite): Promise<void> {
  await runMigrations(db);
  await downgradeToApplicationRole(db);
}

/** Distingue a porta (PostgreSQL real ou simulador embrulhado) de um PGlite cru. */
function ehPorta(alvo: PGlite | PortaBancoDeDados): alvo is PortaBancoDeDados {
  return typeof (alvo as PortaBancoDeDados).comTenant === "function";
}

/**
 * Executa `fn` dentro de uma transação com o contexto de tenant ativo
 * (`app.tenant_id`, local à transação — reverte automaticamente no
 * commit/rollback). Toda leitura/escrita em tabela clínica DEVE passar por
 * aqui: fora de uma transação com este contexto, a RLS nega qualquer linha
 * (nenhum tenant corresponde a um `current_setting` vazio).
 *
 * Aceita tanto um `PGlite` cru (caminho histórico do simulador) quanto uma
 * `PortaBancoDeDados` — é essa aceitação que permite trocar o motor em
 * `apps/api` mexendo SÓ em onde o banco é aberto, sem tocar nenhum dos
 * pontos de chamada.
 */
export async function withTenantTransaction<T>(
  db: PGlite | PortaBancoDeDados,
  tenantId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  if (ehPorta(db)) {
    return db.comTenant(tenantId, fn);
  }
  return db.transaction(async (tx) => {
    // Escopo instalado pela função SELADA (`0004_escopo_selado.sql`), não por
    // `set_config`: um parâmetro de sessão é regravável pelo próprio papel de
    // aplicação, e era por aí que SQL arbitrário pivotava de tenant dentro de
    // uma transação em voo (ACHADO-02). Vale também no simulador, para que o
    // caminho exercitado em desenvolvimento seja o mesmo de produção.
    await tx.query("select intensicare_escopo.instalar($1)", [tenantId]);
    return fn(tx);
  });
}
