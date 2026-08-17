/**
 * Catálogo tipado das variáveis de ambiente do runtime.
 *
 * Esta tabela é a ÚNICA fonte de verdade sobre (i) o que cada variável é,
 * (ii) quando ela é obrigatória e (iii) se ela pode ter valor padrão e em que
 * perfil. O carregador não conhece variável nenhuma por nome fora daqui, e o
 * teste `sem-defaults-inseguros.test.ts` varre esta tabela — de modo que
 * acrescentar amanhã um default para um segredo fica vermelho sem que ninguém
 * precise lembrar de revisar o carregador.
 *
 * REGRA DE DEFAULT (asseverada por teste, três frentes independentes):
 * - variável de classe `banco`, `segredo`, `identidade`, `bundle`, `semeadura`
 *   ou `perfil` só pode ter default em perfil SINTÉTICO;
 * - variável de classe `operacional` pode ter default em qualquer perfil, mas
 *   não pode ter nome que contenha material sensível (SENHA, SEGREDO, TOKEN,
 *   CHAVE, JWKS, EMISSOR, CREDENCIAL, URL) — o que impede reclassificar um
 *   segredo como "operacional" para ganhar direito a default;
 * - nenhum módulo deste diretório usa `.default(` de zod, porque um default
 *   embutido no schema escaparia das duas varreduras acima.
 *
 * PREMISSA (reversível): os NOMES abaixo são proposta de engenharia. Nenhum
 * ADR fixa nome de variável de ambiente; o único registro anterior é
 * `docs/15-release-evidence/final-implementation-audit.md:93`, que usa
 * `PERFIL`. O prefixo `IC_` isola o resto do namespace do processo; `PERFIL` e
 * `PORT` ficam sem prefixo por continuidade (o segundo já é lido hoje em
 * `apps/api/src/index.ts:92`). Renomear é decisão barata do orquestrador — a
 * tabela é o único ponto a mudar.
 */
import { CAPACIDADES, PERFIS_SINTETICOS, type Perfil } from "./perfis.js";

export const MODOS_BANCO = ["pglite-memoria", "postgres"] as const;
export type ModoBanco = (typeof MODOS_BANCO)[number];

export const MODOS_IDENTIDADE = ["token-sintetico", "oidc"] as const;
export type ModoIdentidade = (typeof MODOS_IDENTIDADE)[number];

/**
 * `aplicar` roda as migrações pendentes sob lock; `verificar` recusa o boot se
 * houver migração pendente, sem tocar no schema. Não existe um terceiro modo
 * que ignore a versão do schema: subir contra schema desconhecido é o defeito,
 * não um modo de operação.
 */
export const MODOS_MIGRACAO = ["aplicar", "verificar"] as const;
export type ModoMigracao = (typeof MODOS_MIGRACAO)[number];

export type ClasseSensibilidade =
  | "perfil"
  | "banco"
  | "segredo"
  | "identidade"
  | "bundle"
  | "semeadura"
  | "operacional";

/** Estado já resolvido do qual depende a obrigatoriedade das demais variáveis. */
export interface ContextoRequisito {
  readonly perfil: Perfil;
  readonly bancoModo: ModoBanco;
  readonly identidadeModo: ModoIdentidade;
}

export interface DescritorVariavel {
  readonly nome: string;
  readonly classe: ClasseSensibilidade;
  readonly descricao: string;
  /** Obrigatória neste contexto? Avaliada DEPOIS de perfil e modos resolvidos. */
  readonly exigidaQuando: (ctx: ContextoRequisito) => boolean;
  /** Valor padrão por perfil. Ausência de entrada = sem padrão naquele perfil. */
  readonly padraoPorPerfil?: Readonly<Partial<Record<Perfil, string>>>;
}

const SEMPRE = (): boolean => true;
const NUNCA = (): boolean => false;

/** Atalho: mesmo valor padrão nos dois perfis sintéticos, em nenhum outro. */
function padraoSintetico(valor: string): Readonly<Partial<Record<Perfil, string>>> {
  const mapa: Partial<Record<Perfil, string>> = {};
  for (const perfil of PERFIS_SINTETICOS) mapa[perfil] = valor;
  return Object.freeze(mapa);
}

export const DESCRITORES: readonly DescritorVariavel[] = Object.freeze([
  {
    nome: "PERFIL",
    classe: "perfil",
    descricao:
      "Perfil de execução. Sem padrão em perfil nenhum: a omissão é erro fatal, " +
      "e é isso que impede o modo sintético de ser o que se obtém por omissão.",
    exigidaQuando: SEMPRE,
  },
  {
    nome: "PORT",
    classe: "operacional",
    descricao: "Porta TCP de escuta. Padrão 3000 — default operacional, sem efeito de segurança.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "3000",
      "dev-synthetic": "3000",
      integration: "3000",
      staging: "3000",
      pilot: "3000",
      production: "3000",
    }),
  },
  {
    nome: "IC_BANCO_MODO",
    classe: "banco",
    descricao:
      "pglite-memoria (só em perfil sintético) ou postgres. O default sintético é o " +
      "único ponto do sistema onde PGlite em memória pode ser escolhido sem ato explícito.",
    exigidaQuando: SEMPRE,
    padraoPorPerfil: padraoSintetico("pglite-memoria"),
  },
  {
    nome: "IC_BANCO_URL",
    classe: "banco",
    descricao:
      "URL de conexão PostgreSQL, SEM credencial embutida. Credencial em URL vaza " +
      "em log e em mensagem de erro (anti-padrão 12).",
    exigidaQuando: (ctx) => ctx.bancoModo === "postgres",
  },
  {
    nome: "IC_BANCO_USUARIO",
    classe: "banco",
    descricao:
      "Papel de aplicação, sem SUPERUSER/BYPASSRLS e com credencial própria " +
      "(ADR-0016 §4.1 REQUISITO DE PRODUÇÃO — não é premissa reversível).",
    exigidaQuando: (ctx) => ctx.bancoModo === "postgres",
  },
  {
    nome: "IC_BANCO_SENHA",
    classe: "segredo",
    descricao: "Senha do papel de aplicação, provida fora da URL. Nunca serializada.",
    exigidaQuando: (ctx) => ctx.bancoModo === "postgres",
  },
  {
    nome: "IC_BANCO_SEMEAR_FIXTURES",
    classe: "semeadura",
    descricao:
      "sim|nao. Semeadura de fixtures sintéticas pelo BOOTSTRAP. Em integration a " +
      "carga de dados é ato do harness de teste, nunca do processo subindo.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: padraoSintetico("sim"),
  },
  {
    nome: "IC_IDENTIDADE_MODO",
    classe: "identidade",
    descricao:
      "token-sintetico (só em perfil sintético) ou oidc. Não há fallback de OIDC " +
      "indisponível para token local (anti-padrão 8).",
    exigidaQuando: SEMPRE,
    padraoPorPerfil: padraoSintetico("token-sintetico"),
  },
  {
    nome: "IC_IDENTIDADE_EMISSOR",
    classe: "identidade",
    descricao:
      "Emissor (issuer) OIDC, https. Vendor-neutral: nenhum IdP é selecionado aqui " +
      "— nenhum ADR seleciona um, e a escolha não é de engenharia.",
    exigidaQuando: (ctx) => ctx.identidadeModo === "oidc",
  },
  {
    nome: "IC_IDENTIDADE_AUDIENCIA",
    classe: "identidade",
    descricao: "Audiência (aud) esperada no token. Sem ela, um token de outro serviço passaria.",
    exigidaQuando: (ctx) => ctx.identidadeModo === "oidc",
  },
  {
    nome: "IC_IDENTIDADE_JWKS_URL",
    classe: "identidade",
    descricao: "URL do conjunto de chaves públicas (JWKS), https.",
    exigidaQuando: (ctx) => ctx.identidadeModo === "oidc",
  },
  {
    nome: "IC_BUNDLE_REGRA_CAMINHO",
    classe: "bundle",
    descricao: "Caminho do bundle de regra clínica assinado (ADR-0007).",
    exigidaQuando: (ctx) => CAPACIDADES[ctx.perfil].exigeBundleDeRegra,
  },
  {
    nome: "IC_BUNDLE_REGRA_CHAVE_PUBLICA",
    classe: "bundle",
    descricao:
      "Chave pública de verificação da assinatura do bundle. Pública por natureza, " +
      "mas obrigatória: sem ela não há verificação, e sem verificação não há bundle.",
    exigidaQuando: (ctx) => CAPACIDADES[ctx.perfil].exigeBundleDeRegra,
  },
  {
    nome: "IC_MIGRACAO_MODO",
    classe: "operacional",
    descricao:
      "aplicar|verificar. Em perfil produtivo o padrão é verificar: aplicar schema " +
      "durante o boot de produção é decisão de operação, não comportamento herdado.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "aplicar",
      "dev-synthetic": "aplicar",
      integration: "aplicar",
      staging: "verificar",
      pilot: "verificar",
      production: "verificar",
    }),
  },
  {
    nome: "IC_MIGRACAO_TIMEOUT_MS",
    classe: "operacional",
    descricao:
      "Tempo limite da aquisição do lock e de cada passo de migração. Default " +
      "fecha o caminho (aborta e reverte); aumentar é o ato arriscado, não diminuir.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "30000",
      "dev-synthetic": "30000",
      integration: "30000",
      staging: "30000",
      pilot: "30000",
      production: "30000",
    }),
  },
  {
    nome: "IC_MIGRACAO_LOCK_ID",
    classe: "operacional",
    descricao: "Identificador inteiro do lock consultivo de exclusão mútua de migração.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "20260817",
      "dev-synthetic": "20260817",
      integration: "20260817",
      staging: "20260817",
      pilot: "20260817",
      production: "20260817",
    }),
  },
  {
    nome: "IC_MIGRACAO_PERMITIR_DESTRUTIVA",
    classe: "operacional",
    descricao:
      "sim|nao. Padrão nao em TODO perfil: passo destrutivo exige ato explícito e " +
      "tem restauração de backup como pré-condição (ADR-0020 §4 O6).",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "nao",
      "dev-synthetic": "nao",
      integration: "nao",
      staging: "nao",
      pilot: "nao",
      production: "nao",
    }),
  },
  {
    nome: "IC_MIGRACAO_JANELA_COMPATIBILIDADE",
    classe: "operacional",
    descricao:
      "Quantas versões de schema o código aceita adiantar de uma vez. Defasagem " +
      "maior indica implantação pulada e recusa o boot em vez de adivinhar.",
    exigidaQuando: NUNCA,
    padraoPorPerfil: Object.freeze({
      test: "5",
      "dev-synthetic": "5",
      integration: "5",
      staging: "5",
      pilot: "5",
      production: "5",
    }),
  },
]);

export function descritorDe(nome: string): DescritorVariavel | undefined {
  return DESCRITORES.find((d) => d.nome === nome);
}

/**
 * Contexto CANÔNICO do perfil — os modos que o perfil admite quando o operador
 * não escolhe nada. Usado para responder "o que este perfil exige de mim?" sem
 * um ambiente concreto (documentação, teste e a mensagem de erro do operador).
 */
export function contextoCanonico(perfil: Perfil): ContextoRequisito {
  const sintetico = CAPACIDADES[perfil].classe === "sintetico";
  return {
    perfil,
    bancoModo: sintetico ? "pglite-memoria" : "postgres",
    identidadeModo: sintetico ? "token-sintetico" : "oidc",
  };
}

/** Variáveis que o operador PRECISA prover neste perfil, sem contar as que têm padrão. */
export function variaveisExigidas(perfil: Perfil): readonly string[] {
  const ctx = contextoCanonico(perfil);
  return DESCRITORES.filter(
    (d) => d.exigidaQuando(ctx) && d.padraoPorPerfil?.[perfil] === undefined,
  ).map((d) => d.nome);
}
