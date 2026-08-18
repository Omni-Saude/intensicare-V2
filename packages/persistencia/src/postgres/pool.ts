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
 *
 * QUANDO A RECUSA DE IDENTIDADE ACONTECE — leia antes de chamar de "fechado"
 * -------------------------------------------------------------------------
 * O controle 1 roda UMA vez, em `abrir()`. Ele é um retrato do estado do banco
 * no instante do boot. Uma alteração de esquema feita por superusuário (ou pelo
 * migrador) DEPOIS disso — tipicamente `ALTER TABLE ... INHERIT`, `ATTACH
 * PARTITION`, `CREATE FUNCTION ... SECURITY DEFINER` ou um `GRANT` avulso —
 * NÃO é reavaliada enquanto o processo viver: ela só será vista no próximo boot
 * (ou na próxima migração, cujas auditorias são as mesmas). Isso é "fechado até
 * o próximo deploy", não "fechado".
 *
 * ISSO MUDOU PARCIALMENTE com `../migrations/0006_ancora_isolada.sql`, e a
 * mudança é opcional por TOPOLOGIA, não por conveniência:
 *   - a `0006` §1 tira a âncora de escopo da propriedade do dono do esquema, o
 *     que fecha F1 por ESTRUTURA — não há instante "entre verificações";
 *   - a `0006` §2 instala um EVENT TRIGGER de DDL que reexecuta os invariantes
 *     ao fim de cada comando e ABORTA o que os viole, fechando a janela entre
 *     boots (F2). Criar event trigger exige SUPERUSUÁRIO no PostgreSQL 16 —
 *     privilégio que o papel de migração, por desenho (`0003`), não tem —, e é
 *     por isso que a instalação vive no PROVISIONAMENTO.
 * Quando o fecho não está instalado, o retrato de boot continua sendo tudo o
 * que existe. `ConfiguracaoPostgres.exigirFechoDeRuntime` transforma essa
 * ausência de "limite declarado num README" em RECUSA DE PARTIDA.
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
  /**
   * Exige o FECHO DE RUNTIME da `0006_ancora_isolada.sql`: âncora de escopo
   * isolada num papel guardião, e `EVENT TRIGGER` de DDL instalado e habilitado.
   *
   * Com `true`, abrir contra um banco sem esse fecho é RECUSADO na partida. É
   * o modo que responde à objeção registrada no cabeçalho da `0005` — "um
   * controle presente em alguns ambientes e ausente noutros é pior que um
   * limite declarado": aqui a ausência não é silenciosa, é uma recusa.
   *
   * Padrão `false`, e isso NÃO é opinião de segurança: ligar ou não é escolha
   * de TOPOLOGIA (exige superusuário no provisionamento, o que nem todo serviço
   * gerenciado concede), e escolha de topologia não é decisão deste pacote
   * (contrato de agentes §3). O padrão preserva os bancos de verificação que
   * existem justamente para provar as camadas de migração e de boot.
   */
  readonly exigirFechoDeRuntime?: boolean;
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
  readonly relacoes_alcancaveis_sem_isolamento: number;
  readonly ancestrais_alcancaveis_sem_isolamento: number;
  readonly funcoes_definer_de_terceiro: number;
  readonly visoes_alcancaveis_sem_invocador: number;
  readonly esquemas_fora_da_lista: number;
  /**
   * `true` quando a âncora de escopo pertence a um papel guardião do qual
   * NENHUM papel alcançável pelo dono do esquema é membro (`0006` §1). Enquanto
   * a âncora pertencia ao dono do esquema, qualquer função `SECURITY DEFINER`
   * criada por ele lia e forjava o selo — F1, reproduzido contra 16.14.
   */
  readonly ancora_isolada: boolean;
  /** `true` quando o `EVENT TRIGGER` da `0006` §2 existe e não está desabilitado. */
  readonly guarda_ddl_ativa: boolean;
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
    -- CORRIGIDO (5a revisao adversarial, ACHADO-15/P1): avaliar o privilegio
    -- sobre a RELACAO selo deixava passar o caminho INDIRETO. Uma view simples
    -- sobre ela e AUTO-ATUALIZAVEL e roda com os direitos do DONO: o
    -- privilegio fica sobre a VIEW e some das duas funcoes. O conjunto abaixo
    -- e o FECHO transitivo das relacoes que alcancam o selo via pg_rewrite.
    (with recursive alcancam_o_selo as (
       select to_regclass('intensicare_escopo.selo') as oid
       union
       select r.ev_class
         from pg_depend d
         join pg_rewrite r on r.oid = d.objid
         join alcancam_o_selo a on a.oid = d.refobjid
        where d.classid = 'pg_rewrite'::regclass
          and d.refclassid = 'pg_class'::regclass
          and r.ev_class is distinct from d.refobjid
     )
     select coalesce(bool_or(
              has_table_privilege(
                alvo.oid, rel.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
              or exists (
                select 1 from pg_attribute a
                 where a.attrelid = rel.oid and a.attnum > 0 and not a.attisdropped
                   and has_column_privilege(alvo.oid, rel.oid, a.attnum,
                         'SELECT, INSERT, UPDATE, REFERENCES')
              )), false)
       from pg_roles alvo
       cross join alcancam_o_selo rel
      where rel.oid is not null
        and pg_has_role(session_user, alvo.oid, 'MEMBER')) as alcanca_ancora_do_escopo,
    -- CORRIGIDO (4a revisao adversarial, ACHADO-11/P2): esta guarda partia de
    -- nspname = 'public'. Uma PARTICAO em outro esquema, de uma tabela
    -- particionada de public, nasce sem RLS/FORCE/politica e nao era vista.
    -- O invariante e sobre as relacoes ALCANCAVEIS, nao sobre um esquema.
    (select count(*)::int
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p')
        and n.nspname <> 'information_schema'
        and n.nspname not like 'pg\\_%'
        and exists (
          select 1 from pg_attribute a
           where a.attrelid = c.oid and a.attname = 'tenant_id'
             and a.attnum > 0 and not a.attisdropped)
        and exists (
          select 1 from pg_roles alvo
           where pg_has_role(session_user, alvo.oid, 'MEMBER')
             and has_table_privilege(alvo.oid, c.oid,
                   'SELECT, INSERT, UPDATE, DELETE, REFERENCES'))
        and (
          not c.relrowsecurity
          or not c.relforcerowsecurity
          or not exists (select 1 from pg_policy pol where pol.polrelid = c.oid)
        )) as relacoes_alcancaveis_sem_isolamento,
    -- ACHADO-18 (6a revisao adversarial, P1): a guarda acima exige coluna
    -- tenant_id, e por isso era CEGA ao sentido inverso da heranca. Medido
    -- contra PostgreSQL 16.14: numa consulta a um ANCESTRAL valem as politicas
    -- DELE, e as das descendentes sao IGNORADAS. Como o ancestral so precisa
    -- ter um SUBCONJUNTO das colunas da descendente, ele pode nao ter
    -- tenant_id nenhum — e entao nenhum contador o via. Um
    -- "alter table organizations inherit public.novo_pai" seguido de
    -- "grant select on public.novo_pai" entregava todas as linhas de todos os
    -- tenants com o diagnostico inteiro em ZERO.
    -- Basta o elo DIRETO: todo topo de cadeia alcancavel casa aqui.
    (select count(*)::int
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p', 'f')
        and n.nspname <> 'information_schema'
        and n.nspname not like 'pg\\_%'
        and exists (select 1 from pg_inherits i where i.inhparent = c.oid)
        and exists (
          select 1 from pg_roles alvo
           where pg_has_role(session_user, alvo.oid, 'MEMBER')
             and (
               has_table_privilege(alvo.oid, c.oid,
                 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
               or exists (
                 select 1 from pg_attribute a
                  where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
                    and has_column_privilege(alvo.oid, c.oid, a.attnum,
                          'SELECT, INSERT, UPDATE, REFERENCES')
               )
             ))
        and not (
          c.relrowsecurity
          and c.relforcerowsecurity
          and exists (
            select 1 from pg_policy pol
             where pol.polrelid = c.oid
               and pg_get_expr(pol.polqual, pol.polrelid) ilike '%tenant_atual%')
        )) as ancestrais_alcancaveis_sem_isolamento,
    -- ACHADO-17 (6a revisao adversarial, P1): o fecho por pg_rewrite que
    -- protege a ancora cobre view e matview, e NAO cobre funcao. Uma funcao
    -- SECURITY DEFINER criada pelo migrador escreve no selo em nome da
    -- aplicacao — e o PostgreSQL concede EXECUTE a PUBLIC por PADRAO, sem
    -- nenhum GRANT escrito. Nao da para resolver por alcance (corpo de funcao
    -- nao gera pg_depend sobre as relacoes que referencia, e SQL dinamico
    -- derrota analise estatica), entao a regra e de SUPERFICIE: fora do par
    -- selado, nenhuma. Medido em PostgreSQL 16.14 recem-provisionado: o
    -- conjunto e exatamente esse par, contando pg_catalog inclusive.
    (select count(*)::int
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where p.prosecdef
        and pg_get_userbyid(p.proowner) <> session_user
        and not (n.nspname = 'intensicare_escopo'
                 and p.proname in ('instalar', 'tenant_atual'))
        and (
          exists (
            select 1 from pg_roles alvo
             where pg_has_role(session_user, alvo.oid, 'MEMBER')
               and has_function_privilege(alvo.oid, p.oid, 'EXECUTE')
          )
          -- GATILHO: medido contra PostgreSQL 16.14, a execucao de funcao de
          -- gatilho NAO passa por verificacao de EXECUTE do usuario corrente —
          -- o privilegio e conferido na CRIACAO do gatilho. Logo um gatilho
          -- SECURITY DEFINER numa tabela que a aplicacao escreve roda com os
          -- direitos do DONO mesmo com EXECUTE revogado de todo mundo, e
          -- reescreve o selo no meio de um INSERT legitimo. Contar so o
          -- EXECUTE deixava passar exatamente este caminho.
          or exists (
            select 1
              from pg_trigger tg
              join pg_class rel on rel.oid = tg.tgrelid
             where tg.tgfoid = p.oid
               and not tg.tgisinternal
               and exists (
                 select 1 from pg_roles alvo
                  where pg_has_role(session_user, alvo.oid, 'MEMBER')
                    and has_table_privilege(alvo.oid, rel.oid,
                          'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
               )
          )
        )) as funcoes_definer_de_terceiro,
    -- VIEW/MATVIEW/TABELA ESTRANGEIRA alcancavel. A 0003 ja RECUSA estes
    -- objetos em tempo de migracao (matview e tabela estrangeira nao aceitam
    -- politica; view sem security_invoker roda com os direitos do DONO). O
    -- runtime era CEGO a eles: uma view do migrador sobre um ANCESTRAL sem
    -- politica devolve todos os tenants, e o ancestral nem precisa ser
    -- alcancavel pela aplicacao — medido contra PostgreSQL 16.14.
    (select count(*)::int
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('v', 'm', 'f')
        and n.nspname <> 'information_schema'
        and n.nspname not like 'pg\\_%'
        and exists (
          select 1 from pg_roles alvo
           where pg_has_role(session_user, alvo.oid, 'MEMBER')
             and (
               has_table_privilege(alvo.oid, c.oid,
                 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
               or exists (
                 select 1 from pg_attribute a
                  where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
                    and has_column_privilege(alvo.oid, c.oid, a.attnum,
                          'SELECT, INSERT, UPDATE, REFERENCES')
               )
             ))
        and not (
          c.relkind = 'v'
          and coalesce(array_to_string(c.reloptions, ','), '')
                ~* 'security_invoker\\s*=\\s*(true|on|1)'
        )) as visoes_alcancaveis_sem_invocador,
    -- A aplicacao nao deve alcancar esquema fora da lista permitida: e o que
    -- mantem o conjunto acima limitado e auditavel.
    (select count(*)::int
       from pg_namespace n
      where n.nspname not in ('public', 'intensicare_escopo', 'information_schema')
        and n.nspname not like 'pg\\_%'
        and exists (
          select 1 from pg_roles alvo
           where pg_has_role(session_user, alvo.oid, 'MEMBER')
             and has_schema_privilege(alvo.oid, n.oid, 'USAGE'))) as esquemas_fora_da_lista,
    -- FECHO DE RUNTIME (0006). Diagnostico, nao recusa por padrao: ver
    -- ConfiguracaoPostgres.exigirFechoDeRuntime.
    -- A ancora esta isolada quando o dono da tabela de selo NAO e alcancavel
    -- (por MEMBER, isto e, por SET ROLE) nem a partir do papel de MIGRACAO nem
    -- a partir do papel conectado. Reparar so no NOME do dono seria frágil; o
    -- que importa e a alcancabilidade.
    (select coalesce((
       select not (
         pg_has_role(session_user, c.relowner, 'MEMBER')
         or (to_regrole('intensicare_migrador') is not null
             and pg_has_role('intensicare_migrador', c.relowner, 'MEMBER'))
       )
       from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
        where ns.nspname = 'intensicare_escopo' and c.relname = 'selo'
     ), false)) as ancora_isolada,
    (select exists (
       select 1 from pg_event_trigger et
        join pg_proc p on p.oid = et.evtfoid
        join pg_namespace n on n.oid = p.pronamespace
       where et.evtname = 'intensicare_guarda_ddl'
         and et.evtenabled <> 'D'
         and n.nspname = 'intensicare_guarda')) as guarda_ddl_ativa
  from pg_roles papel
  where papel.rolname = session_user`;

/**
 * Avalia o diagnóstico e devolve a lista de motivos de recusa (vazia = ok).
 *
 * `exigirFechoDeRuntime` acrescenta os dois motivos da `0006`. Ele é parâmetro
 * e não constante porque instalar aquele fecho exige superusuário no
 * provisionamento — condição de TOPOLOGIA, não de código.
 */
export function motivosDeRecusaDeIdentidade(
  d: DiagnosticoIdentidade,
  exigirFechoDeRuntime = false,
): string[] {
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
  if (d.relacoes_alcancaveis_sem_isolamento > 0) {
    motivos.push(
      `o papel conectado alcança ${d.relacoes_alcancaveis_sem_isolamento} relação(ões) com coluna tenant_id sem RLS/FORCE/política — inclusive partições fora do esquema public, que nascem sem isolamento`,
    );
  }
  if (d.ancestrais_alcancaveis_sem_isolamento > 0) {
    motivos.push(
      `o papel conectado alcança ${d.ancestrais_alcancaveis_sem_isolamento} relação(ões) que são ANCESTRAIS de outra(s) por herança/partição e não têm RLS+FORCE+política ancorada — numa consulta ao ancestral valem as políticas DELE, e as das descendentes são IGNORADAS (ACHADO-18)`,
    );
  }
  if (d.funcoes_definer_de_terceiro > 0) {
    motivos.push(
      `o papel conectado alcança ${d.funcoes_definer_de_terceiro} função(ões) SECURITY DEFINER de terceiro fora do par selado (intensicare_escopo.instalar/tenant_atual), por EXECUTE ou por GATILHO em relação que ele escreve — uma delas basta para forjar o selo de escopo e pivotar de tenant; lembre que o PostgreSQL concede EXECUTE a PUBLIC por padrão, e que gatilho roda sem verificar EXECUTE (ACHADO-17)`,
    );
  }
  if (d.visoes_alcancaveis_sem_invocador > 0) {
    motivos.push(
      `o papel conectado alcança ${d.visoes_alcancaveis_sem_invocador} view/matview/tabela estrangeira sem security_invoker=true — ela roda com os direitos do DONO e contorna a RLS de quem consulta (matview e tabela estrangeira não aceitam política nenhuma)`,
    );
  }
  if (d.esquemas_fora_da_lista > 0) {
    motivos.push(
      `o papel conectado alcança ${d.esquemas_fora_da_lista} esquema(s) fora da lista permitida (public, intensicare_escopo)`,
    );
  }
  if (exigirFechoDeRuntime && !d.ancora_isolada) {
    motivos.push(
      "a âncora de escopo (intensicare_escopo.selo) pertence a um papel alcançável pelo dono do esquema — qualquer função SECURITY DEFINER criada por ele lê o selo (quais tenants estão sendo servidos agora) e o forja; aplique o passe de superusuário de 0006_ancora_isolada.sql (F1)",
    );
  }
  if (exigirFechoDeRuntime && !d.guarda_ddl_ativa) {
    motivos.push(
      "a guarda de DDL (event trigger intensicare_guarda_ddl) está ausente ou desabilitada — sem ela, um ALTER TABLE ... INHERIT, um GRANT ou um DROP POLICY executado DEPOIS deste boot não é reavaliado por ninguém até o próximo deploy; aplique o passe de superusuário de 0006_ancora_isolada.sql (F2)",
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
      const motivos = motivosDeRecusaDeIdentidade(
        diagnostico,
        configuracao.exigirFechoDeRuntime === true,
      );
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
