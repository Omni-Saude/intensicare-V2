/**
 * Provisionamento de um banco PostgreSQL para o IntensiCare V2: papéis
 * separados, banco de dados com dono correto e aplicação das migrações.
 *
 * SEPARAÇÃO DE IDENTIDADES (o ponto inteiro deste arquivo)
 * --------------------------------------------------------
 *   superusuário  — só existe aqui, no provisionamento. Cria papéis e banco.
 *                   A aplicação NUNCA recebe esta credencial.
 *   migrador      — dono do banco e das tabelas; aplica migrações. Sem
 *                   SUPERUSER, sem BYPASSRLS, sem CREATEROLE.
 *   aplicação     — sem privilégio, sem propriedade, sem CREATE no esquema.
 *                   É a ÚNICA credencial que o runtime recebe.
 *
 * Ser dono do BANCO é o que dá ao migrador poder sobre o esquema `public`
 * (desde o PostgreSQL 15 o esquema `public` pertence a `pg_database_owner`),
 * sem precisar de nenhum atributo de papel elevado.
 *
 * NÃO decide provedor, região nem residência de dados — isso é do titular
 * (ADR-0016 / ADR-0006). Aqui só se recebe uma URL de superusuário já
 * existente, venha ela do cluster efêmero local (`scripts/pg-efemero.mjs`) ou
 * de um serviço de CI.
 */

import { randomBytes } from "node:crypto";
import { lerMigracoes } from "../session.js";
import { ConexaoPostgres, opcoesDaUrl, urlCom } from "./protocolo.js";

/** Papel dono do esquema, que aplica migrações. Nunca usado pelo runtime. */
export const PAPEL_MIGRADOR = "intensicare_migrador" as const;

/** Papel da aplicação — o único que o runtime conhece. */
export const PAPEL_APLICACAO = "intensicare_app" as const;

export interface OpcoesProvisionamento {
  /** URL de um superusuário num banco de manutenção (tipicamente `postgres`). */
  readonly urlSuperusuario: string;
  /** Nome do banco a criar/usar. Só `[a-z_][a-z0-9_]*`. */
  readonly banco: string;
  readonly senhaMigrador?: string;
  readonly senhaAplicacao?: string;
  /**
   * Aplica migrações só até este arquivo (inclusive). Existe para exercitar o
   * caminho de ATUALIZAÇÃO: provisiona até `0002` e depois aplica `0003` sobre
   * o banco já existente, como aconteceria num ambiente real.
   */
  readonly ateMigracao?: string;
  /**
   * Quem aplica as migrações. `migrador` é o correto e é o padrão;
   * `superusuario` reproduz o estado LEGADO (0001/0002 aplicadas por
   * superusuário, tabelas do superusuário) que a `0003` precisa consertar.
   */
  readonly migrarComo?: "migrador" | "superusuario";
  /** Derruba o banco antes de criar. Só para bancos de verificação. */
  readonly recriarBanco?: boolean;
  /**
   * Dono do BANCO. `migrador` é o correto e é o padrão. `superusuario`
   * reproduz o estado LEGADO real — banco e objetos do superusuário, que é
   * como um ambiente anterior a esta fatia estaria. Sem esta opção não é
   * possível exercitar de verdade o caminho de atualização.
   */
  readonly donoDoBanco?: "migrador" | "superusuario";
}

export interface BancoProvisionado {
  readonly banco: string;
  /** Credencial do runtime — sem privilégio. */
  readonly urlAplicacao: string;
  /** Credencial de migração — dona do esquema. */
  readonly urlMigrador: string;
  /** Superusuário apontando para o banco provisionado (uso administrativo). */
  readonly urlSuperusuarioNoBanco: string;
  readonly migracoesAplicadas: readonly string[];
}

/**
 * Senha aleatória no alfabeto base64url (`A-Za-z0-9_-`). O alfabeto não é
 * cosmético: `ALTER ROLE ... PASSWORD` não aceita parâmetro vinculado, então o
 * valor precisa ir no texto do comando — e um alfabeto sem aspas, barra
 * invertida ou cifrão torna a interpolação verificável (ver `exigirSenhaSegura`).
 */
function gerarSenha(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Senhas geradas UMA vez por processo e reusadas em todas as provisões dele.
 *
 * POR QUE MEMOIZAR: papel é objeto do CLUSTER, não do banco. Cada
 * `provisionarBanco` fazia `alter role ... password <nova aleatória>`, o que
 * INVALIDAVA silenciosamente a URL devolvida por qualquer provisão anterior no
 * mesmo cluster — a conexão seguinte falhava com `28P01` (senha incorreta)
 * ANTES de o controle sob teste ser exercido. Numa suíte isso vira um vermelho
 * que parece P0 e não é; num cluster efêmero reusado entre execuções, idem.
 *
 * Com a memoização, reescrever a senha vira no-op e toda URL emitida por este
 * processo continua válida. A aleatoriedade por processo é preservada — o que
 * se elimina é a rotação DENTRO do processo, que não protegia nada e só
 * quebrava credencial já emitida.
 */
const senhasDoProcesso = new Map<string, string>();

function senhaEstavelDoProcesso(papel: string): string {
  const existente = senhasDoProcesso.get(papel);
  if (existente !== undefined) {
    return existente;
  }
  const nova = gerarSenha();
  senhasDoProcesso.set(papel, nova);
  return nova;
}

const ALFABETO_SENHA = /^[A-Za-z0-9_-]{16,}$/;
const IDENTIFICADOR = /^[a-z_][a-z0-9_]*$/;

function exigirSenhaSegura(senha: string, rotulo: string): void {
  if (!ALFABETO_SENHA.test(senha)) {
    throw new Error(
      `senha de ${rotulo} recusada: use ao menos 16 caracteres do alfabeto [A-Za-z0-9_-]. ` +
        "Esta restrição existe porque a senha é interpolada no texto de ALTER ROLE " +
        "(o PostgreSQL não aceita parâmetro vinculado nesse comando).",
    );
  }
}

function exigirIdentificador(valor: string, rotulo: string): void {
  if (!IDENTIFICADOR.test(valor)) {
    throw new Error(`${rotulo} inválido: '${valor}' — use apenas [a-z_][a-z0-9_]*`);
  }
}

/**
 * Cria/ajusta papéis e banco e aplica as migrações. Idempotente: rodar duas
 * vezes sobre o mesmo banco não quebra nada (as senhas são reescritas).
 */
export async function provisionarBanco(opcoes: OpcoesProvisionamento): Promise<BancoProvisionado> {
  exigirIdentificador(opcoes.banco, "nome de banco");
  const senhaMigrador = opcoes.senhaMigrador ?? senhaEstavelDoProcesso(PAPEL_MIGRADOR);
  const senhaAplicacao = opcoes.senhaAplicacao ?? senhaEstavelDoProcesso(PAPEL_APLICACAO);
  exigirSenhaSegura(senhaMigrador, "migrador");
  exigirSenhaSegura(senhaAplicacao, "aplicação");

  const administrativa = await ConexaoPostgres.conectar(
    opcoesDaUrl(opcoes.urlSuperusuario, "intensicare-provisionamento"),
  );
  try {
    // Papéis. Criados sem nenhum atributo elevado desde o primeiro instante —
    // nunca "cria permissivo e endurece depois".
    await administrativa.executar(`
      do $$
      begin
        if not exists (select 1 from pg_roles where rolname = '${PAPEL_MIGRADOR}') then
          create role ${PAPEL_MIGRADOR}
            nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit login;
        end if;
        if not exists (select 1 from pg_roles where rolname = '${PAPEL_APLICACAO}') then
          create role ${PAPEL_APLICACAO}
            nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit login;
        end if;
      end
      $$;
      alter role ${PAPEL_MIGRADOR}
        with login password '${senhaMigrador}'
        nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit;
      alter role ${PAPEL_APLICACAO}
        with login password '${senhaAplicacao}'
        nosuperuser nobypassrls nocreatedb nocreaterole noreplication noinherit;
    `);

    if (opcoes.recriarBanco) {
      // `drop database` não roda em bloco transacional: vai sozinho.
      await administrativa.executar(`drop database if exists ${opcoes.banco}`);
    }
    const existente = await administrativa.consultar(
      "select 1 as um from pg_database where datname = $1",
      [opcoes.banco],
    );
    if (existente.rows.length === 0) {
      const dono =
        opcoes.donoDoBanco === "superusuario"
          ? opcoesDaUrl(opcoes.urlSuperusuario).usuario
          : PAPEL_MIGRADOR;
      exigirIdentificador(dono, "dono do banco");
      await administrativa.executar(`create database ${opcoes.banco} owner ${dono}`);
    }
    // Sem CONNECT para PUBLIC: só os dois papéis nomeados entram.
    await administrativa.executar(`revoke all on database ${opcoes.banco} from public`);
    await administrativa.executar(
      `grant connect, temporary on database ${opcoes.banco} to ${PAPEL_MIGRADOR}`,
    );
    await administrativa.executar(
      `grant connect on database ${opcoes.banco} to ${PAPEL_APLICACAO}`,
    );
  } finally {
    await administrativa.fechar();
  }

  const urlMigrador = urlCom(opcoes.urlSuperusuario, {
    usuario: PAPEL_MIGRADOR,
    senha: senhaMigrador,
    banco: opcoes.banco,
  });
  const urlAplicacao = urlCom(opcoes.urlSuperusuario, {
    usuario: PAPEL_APLICACAO,
    senha: senhaAplicacao,
    banco: opcoes.banco,
  });
  const urlSuperusuarioNoBanco = urlCom(opcoes.urlSuperusuario, { banco: opcoes.banco });

  const migracoesAplicadas = await aplicarMigracoes(
    opcoes.migrarComo === "superusuario" ? urlSuperusuarioNoBanco : urlMigrador,
    opcoes.ateMigracao,
  );

  return {
    banco: opcoes.banco,
    urlAplicacao,
    urlMigrador,
    urlSuperusuarioNoBanco,
    migracoesAplicadas,
  };
}

/**
 * Aplica as migrações SQL puras, em ordem, cada arquivo numa ÚNICA mensagem
 * `Query` — o que o PostgreSQL envolve numa transação implícita. Consequência
 * deliberada: uma migração ou entra inteira ou não entra (a verificação
 * fail-closed no fim de `0003` só vale se ela puder abortar tudo).
 */
export async function aplicarMigracoes(
  urlMigrador: string,
  ateMigracao?: string,
): Promise<readonly string[]> {
  const migracoes = lerMigracoes(ateMigracao);
  const conexao = await ConexaoPostgres.conectar(opcoesDaUrl(urlMigrador, "intensicare-migracao"));
  const aplicadas: string[] = [];
  try {
    for (const migracao of migracoes) {
      await conexao.executar(migracao.sql);
      aplicadas.push(migracao.nome);
    }
  } finally {
    await conexao.fechar();
  }
  return aplicadas;
}

/**
 * Aplica UMA migração nomeada. Existe para o caminho de ATUALIZAÇÃO: um banco
 * que já está em `0002` recebe só a `0003`, exatamente como aconteceria num
 * ambiente real — reaplicar `0001` ali falharia, e mascarar isso com
 * `if not exists` em toda a migração esconderia justamente o que se quer testar.
 */
export async function aplicarMigracao(urlMigrador: string, nome: string): Promise<void> {
  const migracao = lerMigracoes(nome).find((m) => m.nome === nome);
  if (!migracao) {
    throw new Error(`migração desconhecida: ${nome}`);
  }
  const conexao = await ConexaoPostgres.conectar(opcoesDaUrl(urlMigrador, "intensicare-migracao"));
  try {
    await conexao.executar(migracao.sql);
  } finally {
    await conexao.fechar();
  }
}

/** Nome de banco de verificação, único por execução, sempre no padrão aceito. */
export function nomeDeBancoDeVerificacao(prefixo = "intensicare_verificacao"): string {
  return `${prefixo}_${randomBytes(4).toString("hex")}`;
}
