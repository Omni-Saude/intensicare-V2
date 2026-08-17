/**
 * Adaptador de PostgreSQL real: pool de conexões autenticadas JÁ como papel de
 * aplicação sem privilégio, com escopo de tenant por transação e higienização
 * garantida da conexão antes de ela voltar ao pool.
 *
 * TRÊS CONTROLES VIVEM AQUI — todos fail-closed:
 *
 *  1. RECUSA DE IDENTIDADE (ao abrir): se o papel conectado for superusuário,
 *     tiver BYPASSRLS, puder alcançar por `SET ROLE` um papel que tenha, ou
 *     for dono de tabela do esquema, a aplicação NÃO ABRE. Isso materializa o
 *     anti-padrão 5 do contrato ("usar superusuário, owner ou BYPASSRLS como
 *     identidade da aplicação") como erro de partida, não como comentário.
 *  2. ESCOPO DE TENANT OBRIGATÓRIO: `comTenant` recusa tenant vazio e confere
 *     que o `set_config` realmente instalou o valor pedido — nunca deixa uma
 *     consulta rodar com escopo que ela acha que tem mas não tem.
 *  3. HIGIENE DE CONEXÃO: ao voltar ao pool a conexão sofre `rollback` +
 *     `DISCARD ALL`; se a higienização falhar, a conexão é DESTRUÍDA em vez de
 *     reusada. Uma conexão cujo estado não pôde ser provado limpo nunca serve
 *     ao próximo tenant.
 *
 * O que este arquivo NÃO faz: não escolhe provedor, região ou residência de
 * dados (decisão do titular); não alega que a RLS está verificada — verificação
 * exige terceiro independente (DEC-G0-02) e o gate MG-G6.
 */

import type { Transaction } from "@electric-sql/pglite";
import {
  ErroIdentidadeInsegura,
  ErroTenantAusente,
  type ExecutorTenant,
  type PortaBancoDeDados,
  type RotuloAdaptador,
} from "./porta.js";
import { ConexaoPostgres, opcoesDaUrl, type ResultadoSql } from "./protocolo.js";

export interface ConfiguracaoPostgres {
  /** URL de conexão do papel de APLICAÇÃO (nunca a do migrador/superusuário). */
  readonly url: string;
  /** Conexões físicas simultâneas. Padrão 4. */
  readonly tamanhoMaximo?: number;
  readonly nomeAplicacao?: string;
  readonly tempoLimiteMs?: number;
}

interface DiagnosticoIdentidade {
  readonly usuario_atual: string;
  readonly usuario_sessao: string;
  readonly rolsuper: boolean;
  readonly rolbypassrls: boolean;
  readonly rolcreaterole: boolean;
  readonly rolcreatedb: boolean;
  readonly rolreplication: boolean;
  readonly papeis_perigosos_alcancaveis: number;
  readonly tabelas_proprias: number;
  readonly alcanca_ancora_do_escopo: boolean;
}

/**
 * Consulta de diagnóstico da identidade conectada. Repara em `session_user`,
 * não em `current_user`: `current_user` pode ter sido rebaixado por um
 * `SET ROLE` — é justamente o rebaixamento que NÃO queremos aceitar como
 * prova de nada.
 */
const SQL_DIAGNOSTICO_IDENTIDADE = `
  select
    current_user::text as usuario_atual,
    session_user::text as usuario_sessao,
    papel.rolsuper,
    papel.rolbypassrls,
    papel.rolcreaterole,
    papel.rolcreatedb,
    papel.rolreplication,
    (select count(*)::int
       from pg_roles alvo
      where alvo.rolname <> session_user
        and pg_has_role(session_user, alvo.oid, 'MEMBER')
        and (
          alvo.rolsuper
          or alvo.rolbypassrls
          -- CORRIGIDO após revisão adversarial (ACHADO-03): alcançar o papel
          -- DONO das tabelas basta para escapar da RLS — o dono pode remover o
          -- FORCE ROW LEVEL SECURITY. O migrador não é super nem BYPASSRLS,
          -- então contar só esses dois atributos deixava passar um
          -- GRANT intensicare_migrador TO intensicare_app.
          -- CORRIGIDO (ACHADO-05): filtrar só ('r','p') deixava passar o dono
          -- de MATERIALIZED VIEW, VIEW ou FOREIGN TABLE — objetos que também
          -- expõem dado de tenant e não suportam (ou contornam) a RLS.
          or exists (
            select 1
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where c.relowner = alvo.oid
               and c.relkind in ('r', 'p', 'm', 'v', 'f')
               and n.nspname <> 'information_schema'
               and n.nspname not like 'pg\\_%'
          )
        )) as papeis_perigosos_alcancaveis,
    (select count(*)::int
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p', 'm', 'v', 'f')
        and pg_get_userbyid(c.relowner) = session_user) as tabelas_proprias,
    -- A âncora do escopo NÃO tem RLS (por construção): quem puder tocá-la
    -- forja o selo e escolhe qualquer tenant. has_table_privilege resolve
    -- privilégio HERDADO — é assim que pg_write_all_data é detectado, coisa
    -- que uma consulta a information_schema não veria.
    -- Avaliado sobre TODOS os papéis alcançáveis, não só sobre o papel
    -- conectado: o papel de aplicação é NOINHERIT, então o privilégio de
    -- pg_write_all_data só aparece DEPOIS de um SET ROLE — e perguntar
    -- has_table_privilege(session_user, ...) devolveria falso enquanto o
    -- caminho de escalada continuava aberto.
    -- CORRIGIDO (3a revisao adversarial, ACHADO-02/P1): has_table_privilege
    -- responde só sobre privilégio de TABELA. Um GRANT UPDATE (tenant_id)
    -- não aparecia nele, o detector devolvia false, o pool abria, e a
    -- aplicação reescrevia a coluna do selo — UPDATE sem WHERE não exige
    -- SELECT. A verificação passa a cobrir também privilégio de COLUNA.
    (select coalesce(bool_or(
              has_table_privilege(
                alvo.oid, ancora.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
              or exists (
                select 1 from pg_attribute a
                 where a.attrelid = ancora.oid and a.attnum > 0 and not a.attisdropped
                   and has_column_privilege(alvo.oid, ancora.oid, a.attnum,
                         'SELECT, INSERT, UPDATE, REFERENCES')
              )), false)
       from pg_roles alvo
       cross join (select to_regclass('intensicare_escopo.selo') as oid) ancora
      where ancora.oid is not null
        and pg_has_role(session_user, alvo.oid, 'MEMBER')) as alcanca_ancora_do_escopo
  from pg_roles papel
  where papel.rolname = session_user`;

/** Avalia o diagnóstico e devolve a lista de motivos de recusa (vazia = ok). */
export function motivosDeRecusaDeIdentidade(d: DiagnosticoIdentidade): string[] {
  const motivos: string[] = [];
  if (d.rolsuper) {
    motivos.push(`o papel conectado '${d.usuario_sessao}' é SUPERUSUÁRIO (ignora RLS)`);
  }
  if (d.rolbypassrls) {
    motivos.push(`o papel conectado '${d.usuario_sessao}' tem BYPASSRLS`);
  }
  if (d.rolcreaterole) {
    motivos.push(
      `o papel conectado '${d.usuario_sessao}' tem CREATEROLE (pode criar papel privilegiado)`,
    );
  }
  if (d.rolreplication) {
    motivos.push(
      `o papel conectado '${d.usuario_sessao}' tem REPLICATION (pode ler o WAL inteiro)`,
    );
  }
  if (d.papeis_perigosos_alcancaveis > 0) {
    motivos.push(
      `o papel conectado alcança ${d.papeis_perigosos_alcancaveis} papel(is) com SUPERUSER, BYPASSRLS ou que são DONO DE TABELA do esquema, via SET ROLE`,
    );
  }
  if (d.tabelas_proprias > 0) {
    motivos.push(
      `o papel conectado é dono de ${d.tabelas_proprias} tabela(s) do esquema public (dono e aplicação devem ser identidades distintas)`,
    );
  }
  if (d.alcanca_ancora_do_escopo) {
    motivos.push(
      "o papel conectado tem privilégio sobre intensicare_escopo.selo — a âncora do escopo de tenant não tem RLS por construção, e quem a escreve forja o escopo (verifique GRANTs e papéis predefinidos como pg_write_all_data / pg_read_all_data)",
    );
  }
  if (d.usuario_atual !== d.usuario_sessao) {
    motivos.push(
      `a conexão chegou com papel já trocado (current_user='${d.usuario_atual}', session_user='${d.usuario_sessao}') — a aplicação deve AUTENTICAR-SE como o papel final, não rebaixar-se a ele`,
    );
  }
  return motivos;
}

/**
 * Transação com escopo de tenant. Implementa a forma de `Transaction` do
 * PGlite de propósito (ver `porta.ts`): assim os repositórios existentes
 * rodam sem alteração sobre PostgreSQL real.
 */
export class TransacaoPostgres {
  private encerrada = false;
  private revertida = false;

  constructor(private readonly conexao: ConexaoPostgres) {}

  get closed(): boolean {
    return this.encerrada;
  }

  /** Sinaliza que `fn` pediu rollback — lido por `comTenant`. */
  get pediuRollback(): boolean {
    return this.revertida;
  }

  /** Invalida o executor: usá-lo depois do fim da transação passa a lançar. */
  invalidar(): void {
    this.encerrada = true;
  }

  /**
   * Devolve o erro (em vez de lançar) para que os métodos assíncronos rejeitem
   * a Promise: uma API `async` que lança SÍNCRONO obriga o chamador a
   * embrulhar em `try` além do `catch` — e é assim que uma falha de escopo
   * escaparia de um `.catch()` bem-intencionado.
   */
  private erroSeMorta(): Error | null {
    if (!this.encerrada) {
      return null;
    }
    return new Error(
      "transação já encerrada: o executor não pode ser usado fora do escopo de comTenant " +
        "(guardar `tx` e usá-lo depois vazaria o escopo de tenant da transação anterior)",
    );
  }

  query<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<ResultadoSql<T>> {
    const morta = this.erroSeMorta();
    if (morta) {
      return Promise.reject(morta);
    }
    return this.conexao.consultar<T>(query, params ?? []);
  }

  /** Interpolação por template: os valores viram `$1..$n`, nunca texto. */
  sql<T = Record<string, unknown>>(
    sqlStrings: TemplateStringsArray,
    ...params: unknown[]
  ): Promise<ResultadoSql<T>> {
    const morta = this.erroSeMorta();
    if (morta) {
      return Promise.reject(morta);
    }
    let texto = "";
    for (let i = 0; i < sqlStrings.length; i += 1) {
      texto += sqlStrings[i] ?? "";
      if (i < params.length) {
        texto += `$${i + 1}`;
      }
    }
    return this.conexao.consultar<T>(texto, params);
  }

  async exec(query: string): Promise<ResultadoSql[]> {
    const morta = this.erroSeMorta();
    if (morta) {
      throw morta;
    }
    return [await this.conexao.executar(query)];
  }

  async rollback(): Promise<void> {
    const morta = this.erroSeMorta();
    if (morta) {
      throw morta;
    }
    this.revertida = true;
    this.encerrada = true;
    await this.conexao.executar("rollback");
  }

  /**
   * `LISTEN/NOTIFY` não é suportado por este cliente mínimo. Recusa explícita
   * é preferível a um `no-op` silencioso: um assinante que acha que assinou e
   * nunca recebe evento é exatamente o modo de falha que não queremos.
   */
  listen(
    _channel: string,
    _callback: (payload: string) => void,
  ): Promise<(tx?: Transaction) => Promise<void>> {
    return Promise.reject(
      new Error(
        "LISTEN/NOTIFY não é suportado pelo cliente mínimo de PostgreSQL deste pacote " +
          "(ver cabeçalho de protocolo.ts); o relay do outbox usa consulta, não notificação",
      ),
    );
  }
}

/**
 * Verificação em tempo de COMPILAÇÃO de que `TransacaoPostgres` serve onde os
 * repositórios pedem `Transaction`. Se alguém quebrar a forma, o typecheck
 * falha aqui — e não num consumidor distante.
 */
type ExigeCompatibilidade<T extends Transaction> = T;
export type CompatibilidadeComRepositorios = ExigeCompatibilidade<TransacaoPostgres>;

/**
 * Pool de conexões físicas. Pequeno de propósito: o objetivo aqui é a
 * FRONTEIRA (identidade, escopo, higiene), não desempenho.
 */
export class PoolPostgres {
  private readonly ociosas: ConexaoPostgres[] = [];
  private readonly emUso = new Set<ConexaoPostgres>();
  private readonly esperando: {
    cumprir: (c: ConexaoPostgres) => void;
    rejeitar: (e: Error) => void;
  }[] = [];
  private encerrado = false;
  private abertas = 0;

  constructor(private readonly configuracao: ConfiguracaoPostgres) {}

  private get tamanhoMaximo(): number {
    return this.configuracao.tamanhoMaximo ?? 4;
  }

  private async abrirNova(): Promise<ConexaoPostgres> {
    const opcoes = opcoesDaUrl(
      this.configuracao.url,
      this.configuracao.nomeAplicacao ?? "intensicare-app",
    );
    return ConexaoPostgres.conectar(
      this.configuracao.tempoLimiteMs === undefined
        ? opcoes
        : { ...opcoes, tempoLimiteMs: this.configuracao.tempoLimiteMs },
    );
  }

  async adquirir(): Promise<ConexaoPostgres> {
    if (this.encerrado) {
      throw new Error("pool já encerrado");
    }
    const ociosa = this.ociosas.pop();
    if (ociosa) {
      this.emUso.add(ociosa);
      await this.exigirConexaoLimpa(ociosa);
      return ociosa;
    }
    if (this.abertas < this.tamanhoMaximo) {
      this.abertas += 1;
      try {
        const nova = await this.abrirNova();
        this.emUso.add(nova);
        return nova;
      } catch (erro) {
        this.abertas -= 1;
        throw erro;
      }
    }
    return new Promise<ConexaoPostgres>((cumprir, rejeitar) => {
      this.esperando.push({ cumprir, rejeitar });
    });
  }

  /**
   * Recusa entregar uma conexão que ainda carregue escopo de tenant. É
   * redundante com a higienização da devolução — de propósito: se um dia a
   * higienização falhar em silêncio, o vazamento aparece AQUI, como erro
   * alto, e não como linha de outro tenant numa resposta.
   */
  private async exigirConexaoLimpa(conexao: ConexaoPostgres): Promise<void> {
    const r = await conexao.consultar<{ tenant: string | null }>(
      "select current_setting('app.tenant_id', true) as tenant",
    );
    const tenant = r.rows[0]?.tenant;
    if (tenant !== null && tenant !== undefined && tenant !== "") {
      this.emUso.delete(conexao);
      this.abertas -= 1;
      await conexao.fechar();
      throw new Error(
        `conexão reusada do pool ainda carregava app.tenant_id='${tenant}' — conexão descartada (falha de higiene, THR-0002)`,
      );
    }
  }

  /**
   * Devolve a conexão ao pool depois de higienizá-la. `DISCARD ALL` executa
   * `SET SESSION AUTHORIZATION DEFAULT`, `RESET ALL`, `DEALLOCATE ALL`,
   * `CLOSE ALL`, `UNLISTEN *` e descarta planos/temporárias — ou seja, apaga
   * também um `app.tenant_id` que tenha sido posto em escopo de SESSÃO.
   */
  async liberar(conexao: ConexaoPostgres): Promise<void> {
    this.emUso.delete(conexao);
    let limpa = true;
    try {
      await conexao.executar("rollback");
      await conexao.executar("discard all");
    } catch {
      limpa = false;
    }
    if (!limpa || this.encerrado) {
      this.abertas -= 1;
      await conexao.fechar();
      this.servirProximoDaFila();
      return;
    }
    const proximo = this.esperando.shift();
    if (proximo) {
      this.emUso.add(conexao);
      proximo.cumprir(conexao);
      return;
    }
    this.ociosas.push(conexao);
  }

  /** Alguém esperava por uma conexão que acabou de ser destruída: abre outra. */
  private servirProximoDaFila(): void {
    const proximo = this.esperando.shift();
    if (!proximo) {
      return;
    }
    this.abertas += 1;
    this.abrirNova().then(
      (nova) => {
        this.emUso.add(nova);
        proximo.cumprir(nova);
      },
      (erro: Error) => {
        this.abertas -= 1;
        proximo.rejeitar(erro);
      },
    );
  }

  async encerrar(): Promise<void> {
    this.encerrado = true;
    while (this.esperando.length > 0) {
      this.esperando.shift()?.rejeitar(new Error("pool encerrado"));
    }
    const todas = [...this.ociosas, ...this.emUso];
    this.ociosas.length = 0;
    this.emUso.clear();
    this.abertas = 0;
    await Promise.all(todas.map((c) => c.fechar()));
  }

  get conexoesAbertas(): number {
    return this.abertas;
  }
}

/** Implementação da porta sobre PostgreSQL real. */
export class AdaptadorPostgres implements PortaBancoDeDados {
  readonly rotulo: RotuloAdaptador = "postgres";
  readonly fronteiraDeIsolamentoVerificavel = true;

  private constructor(readonly pool: PoolPostgres) {}

  /**
   * Abre o adaptador e RECUSA a identidade se ela não servir. A verificação
   * acontece antes de qualquer consulta de negócio: um banco mal provisionado
   * falha na partida, não na primeira leitura clínica.
   */
  static async abrir(configuracao: ConfiguracaoPostgres): Promise<AdaptadorPostgres> {
    const pool = new PoolPostgres(configuracao);
    const conexao = await pool.adquirir();
    try {
      const r = await conexao.consultar<DiagnosticoIdentidade>(SQL_DIAGNOSTICO_IDENTIDADE);
      const diagnostico = r.rows[0];
      if (!diagnostico) {
        throw new ErroIdentidadeInsegura([
          "não foi possível ler os atributos do papel conectado em pg_roles",
        ]);
      }
      const motivos = motivosDeRecusaDeIdentidade(diagnostico);
      if (motivos.length > 0) {
        throw new ErroIdentidadeInsegura(motivos);
      }
    } catch (erro) {
      await pool.liberar(conexao);
      await pool.encerrar();
      throw erro;
    }
    await pool.liberar(conexao);
    return new AdaptadorPostgres(pool);
  }

  async comTenant<T>(tenantId: string, fn: (tx: ExecutorTenant) => Promise<T>): Promise<T> {
    if (typeof tenantId !== "string" || tenantId.trim() === "") {
      throw new ErroTenantAusente();
    }
    const conexao = await this.pool.adquirir();
    const transacao = new TransacaoPostgres(conexao);
    try {
      await conexao.executar("begin");
      // O escopo é instalado pela função SELADA (`0004_escopo_selado.sql`), não
      // por `set_config`: um parâmetro de sessão é regravável pelo próprio
      // papel de aplicação, e era por aí que SQL arbitrário pivotava de tenant
      // dentro de uma transação em voo (ACHADO-02). A função grava numa tabela
      // que a aplicação não tem privilégio de escrever, chaveada pela
      // transação corrente, e RECUSA trocar um escopo já instalado.
      // O retorno é conferido para que "escopo instalado" nunca seja suposição.
      const instalado = await conexao.consultar<{ valor: string }>(
        "select intensicare_escopo.instalar($1) as valor",
        [tenantId],
      );
      if (instalado.rows[0]?.valor !== tenantId) {
        throw new Error(
          `falha ao instalar o escopo de tenant: app.tenant_id ficou '${instalado.rows[0]?.valor}' em vez de '${tenantId}'`,
        );
      }
      const resultado = await fn(transacao);
      if (transacao.pediuRollback) {
        return resultado;
      }
      await conexao.executar("commit");
      return resultado;
    } catch (erro) {
      try {
        await conexao.executar("rollback");
      } catch {
        // Conexão já perdida: a higienização em `liberar` a descarta.
      }
      throw erro;
    } finally {
      transacao.invalidar();
      await this.pool.liberar(conexao);
    }
  }

  async encerrar(): Promise<void> {
    await this.pool.encerrar();
  }
}
