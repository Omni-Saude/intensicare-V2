# Política de migração de schema

Rótulo epistêmico deste documento: **OBSERVED** para a seção "Estado atual",
**PROPOSAL** para a política e para a porta descrita adiante. Nada aqui é
decisão ratificada, e nada aqui alega prontidão de produção, conformidade ou
segurança comprovada.

Este README existe porque a política de migração é a única parte do bootstrap
que pode corromper dado **de forma irreversível** e, até aqui, não estava
escrita em lugar nenhum — nem como código, nem como prosa.

---

## 1. Estado atual (OBSERVED)

`session.ts::runMigrations` aplica os arquivos SQL em sequência, sempre, contra
um banco recém-criado:

```
const MIGRATION_FILES = ["0001_init.sql", "0002_g7_integration.sql"] as const;
```

Verificado por busca no pacote inteiro
(`grep -rni "advisory|lock|timeout|schema_version|rollback" packages/persistencia/src`):
**não existe** lock de exclusão mútua, **não existe** tabela de versão de
schema, **não existe** tempo limite e **não existe** reversão. `provisionamento.ts`
acrescentou `aplicarMigracoes`, que também não tem lock nem versão.

Isso está **correto** para o que existe hoje: cada processo cria o seu próprio
PGlite em memória, e um banco privado por processo não tem concorrente com quem
disputar. O defeito aparece no instante em que o banco passa a ser
compartilhado — dois processos subindo ao mesmo tempo migram em paralelo, e o
resultado depende de quem chegou primeiro em cada `CREATE`.

Portanto: o que está no repositório não é um bug a corrigir agora; é uma
premissa que deixa de valer quando o banco vira PostgreSQL real, e é preciso
que esteja escrito **antes** de alguém apontar o processo para um banco
compartilhado.

## 2. Política exigida

Origem: ADR-0019 §2.1 E2 ("rodar migrações com estratégia de rollback"),
ADR-0019 §5.2 P7 (todo ambiente além do dev local declara rollback/roll-forward
**antes** de receber tráfego real) e ADR-0020 §6 (o restore ensaiado cobre
também migração de schema).

1. **Exclusão mútua.** Um único migrador por vez, por lock consultivo no
   próprio banco. Lock em processo, arquivo ou orquestrador não serve: o que
   precisa ser serializado é o acesso ao *banco*, e o banco é o único lugar que
   todos os candidatos enxergam.
2. **Tempo limite.** Tanto a aquisição do lock quanto cada passo. Migração sem
   tempo limite não falha — ela pendura a implantação, o que é pior, porque não
   dispara alarme.
3. **Compatibilidade de versão, verificada antes de qualquer escrita.**
   - banco **à frente** do código: recusar o boot. É o que acontece quando se
     reverte a aplicação sem reverter o schema, e o sintoma não é um erro claro
     — é uma consulta devolvendo coluna a menos;
   - banco **atrás** do código dentro da janela: migrar (roll-forward);
   - defasagem **maior que a janela**: recusar. Indica implantação pulada.
4. **Expand/contract.** Passo destrutivo (remove ou reescreve dado/coluna
   existente) é barrado por padrão e exige ato explícito
   (`IC_MIGRACAO_PERMITIR_DESTRUTIVA=sim`), com backup verificado como
   pré-condição — ver §4.
5. **Reversão.** Falha ou expiração em qualquer passo reverte **todos** os
   passos envolvidos, em ordem inversa, inclusive aquele em que a falha
   ocorreu: um passo que expirou tem efeito **desconhecido**, e tratar
   desconhecido como "não aplicado" é exatamente como se deixa meia migração
   dentro do banco. Por isso a reversão precisa ser **idempotente**.
6. **Irreversível é um desfecho nomeado, não um erro genérico.** Quando um
   passo envolvido não declara reversão determinística, ou quando a própria
   reversão falha, o resultado diz isso com todas as letras e aponta a
   pré-condição de backup — em vez de virar "falhou ao subir" no log.

## 3. Onde isto está implementado

O orquestrador — verificação de compatibilidade, lock, tempo limite, reversão —
está em `apps/api/src/config/migracao.ts`, **puro de driver**: conversa com uma
interface `PortaMigracao` e não conhece SQL nem lock consultivo. É essa
separação que torna reversão, contenção de lock e expiração asseveráveis sem
subir banco (ver `apps/api/src/config/migracao.test.ts`), e é ela que impede
que uma conclusão obtida sob PGlite seja apresentada como válida para
PostgreSQL de produção (anti-padrão 6).

A porta que o adaptador precisa implementar:

```ts
interface PortaMigracao {
  adquirirLock(lockId: number, timeoutMs: number): Promise<boolean>;
  liberarLock(lockId: number): Promise<void>;
  versaoAplicada(): Promise<number>;
  aplicar(passo: PassoMigracao): Promise<void>;
  reverter(passo: PassoMigracao): Promise<void>;
}
```

Contrato exigido de quem implementar:

- `adquirirLock` devolve `false` quando outro processo detém o lock; **não**
  bloqueia indefinidamente por conta própria;
- `reverter` é **idempotente** — pode ser chamado para um passo cuja aplicação
  expirou e cujo efeito é desconhecido;
- o lock é liberado junto com a conexão, para que um processo morto não deixe
  migração travada para sempre.

**PENDENTE (BLOQUEADO por dependência, não por decisão):** nada em
`packages/persistencia` implementa essa porta hoje. O subsistema
`src/postgres/` expõe `provisionarBanco`, `aplicarMigracoes`, `PAPEL_MIGRADOR`
e `PAPEL_APLICACAO`, mas nenhum lock consultivo e nenhuma tabela de versão de
schema. Enquanto a porta não for implementada, a política desta seção está
**escrita e testada contra um duplo de teste, e não exercida contra PostgreSQL
real** — o que é uma limitação real e não deve ser lida como cobertura.

Duas propriedades que o implementador precisa preservar, porque estão fora do
alcance do orquestrador:

1. **Papéis separados.** Migração roda como `PAPEL_MIGRADOR`; a aplicação
   conecta como `PAPEL_APLICACAO`, sem `SUPERUSER`/`BYPASSRLS` e sem
   propriedade de tabela (ADR-0016 §4.1, `0003_fronteira_papeis.sql`). A
   conexão que migra **não** é a conexão que serve tráfego.
2. **Versão de schema durável.** `versaoAplicada()` precisa ler de uma tabela
   no próprio banco. Inferir versão a partir da presença de uma coluna é
   adivinhação, e adivinhação sob lock é pior que ausência de lock.

## 4. Backup — pré-condição documentada, NÃO executável aqui

Nada neste repositório cria, valida ou restaura backup, e nada aqui simula
backup. Isso é deliberado: um teste que "simulasse" restauração produziria
verde sobre uma capacidade inexistente, que é a forma mais cara de falso-verde.

ADR-0020 §4 O6 é explícita: **"restore que nunca foi ensaiado não conta como
backup"**, e o ensaio periódico de restauração com dado sintético é condição de
promoção a piloto/produção (Gate G8).

Consequência operacional, a ser cumprida **fora** deste código:

- antes de qualquer passo destrutivo, existe backup verificado e restaurável,
  cuja restauração já foi ensaiada e teve RTO/RPO medidos;
- quando o desfecho é `falha-irreversivel`, a recuperação é por restauração —
  não há caminho automático, e o processo não tenta um;
- enquanto o ensaio de restauração não existir, `IC_MIGRACAO_PERMITIR_DESTRUTIVA=sim`
  em perfil produtivo não tem pré-condição satisfeita. O código não consegue
  verificar isso e, portanto, não o afirma: é responsabilidade humana declarada.

## 5. O que este documento não decide

Não seleciona provedor de nuvem, região, residência de dado, produto de banco
gerenciado nem ambiente AMH — ADR-0019 mantém todos esses pontos explicitamente
em aberto (§5 "não vinculado: o fornecedor de nuvem concreto ou região exata";
§11 "nenhum fornecedor de nuvem selecionado"). Não fixa valor de RTO, RPO,
janela de manutenção ou frequência de ensaio de restauração: são alvos
numéricos, e nenhum foi decidido (ADR-0020 §4 O2, VALIDATION REQUIRED até G1).
