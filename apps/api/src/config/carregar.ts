/**
 * Carregamento e validação da configuração de runtime.
 *
 * Contrato deste módulo, em uma frase: ou devolve uma `ConfiguracaoRuntime`
 * inteiramente validada, ou LANÇA — nunca devolve algo parcialmente
 * configurado, e nunca inventa valor para o que faltou. É este módulo que faz
 * a afirmação de validação de ADR-0019 §9 V2 ("Boot falha (fail-closed) quando
 * configuração obrigatória está ausente") deixar de ser prosa.
 *
 * Ordem deliberada: perfil primeiro (sem ele nada mais tem significado), depois
 * os modos (banco e identidade, dos quais depende o que é obrigatório), depois
 * obrigatoriedade, depois capacidades do perfil, depois forma dos valores.
 * Todos os problemas são acumulados; o lançamento é único e no fim.
 *
 * Quando um modo não pode ser lido, o carregador NÃO adivinha: assume o modo
 * canônico do perfil (`contextoCanonico`), que em perfil endurecido é sempre o
 * mais exigente. Um valor ilegível nunca reduz o que o sistema cobra.
 */
import { construirBanner } from "./banner.js";
import { ErroDeConfiguracao, type ProblemaConfiguracao } from "./erros.js";
import {
  type ConfiguracaoBundleRegra,
  type ConfiguracaoRuntime,
  esquemaConfiguracaoRuntime,
} from "./esquema.js";
import { CAPACIDADES, ehPerfil, PERFIS, type Perfil } from "./perfis.js";
import { Segredo } from "./segredo.js";
import {
  type ContextoRequisito,
  contextoCanonico,
  DESCRITORES,
  descritorDe,
  MODOS_BANCO,
  MODOS_IDENTIDADE,
  MODOS_MIGRACAO,
  type ModoBanco,
  type ModoIdentidade,
  type ModoMigracao,
} from "./variaveis.js";

export type AmbienteBruto = Readonly<Record<string, string | undefined>>;

/**
 * Papéis de banco notoriamente privilegiados. Conectar a aplicação como
 * qualquer um deles derrota a RLS inteira, porque superusuário e dono de
 * tabela não são filtrados por política (anti-padrão 5; ADR-0016 §4.1, que
 * registra isso como REQUISITO DE PRODUÇÃO e não como premissa reversível).
 * Esta lista denuncia nomes conhecidos — não é, e não pode ser, prova de que
 * o papel configurado seja de fato não privilegiado: essa verificação é do
 * lado do banco e pertence ao adaptador PostgreSQL. Ver handoff.
 */
const PAPEIS_PROIBIDOS: ReadonlySet<string> = new Set([
  "postgres",
  "root",
  "superuser",
  "owner",
  "rds_superuser",
  "azure_superuser",
  "cloudsqlsuperuser",
  "supabase_admin",
]);

const PROTOCOLOS_BANCO: ReadonlySet<string> = new Set(["postgres:", "postgresql:"]);

const VERDADEIROS: ReadonlySet<string> = new Set(["sim"]);
const FALSOS: ReadonlySet<string> = new Set(["nao", "não"]);

function normalizar(valor: string | undefined): string | undefined {
  if (valor === undefined) return undefined;
  const limpo = valor.trim();
  return limpo.length === 0 ? undefined : limpo;
}

function listar(valores: readonly string[]): string {
  return valores.map((v) => `"${v}"`).join(", ");
}

/** Ergue um problema SEM ecoar o valor observado — ver nota de topo de `erros.ts`. */
function problema(variavel: string, perfil: Perfil | null, motivo: string): ProblemaConfiguracao {
  return { variavel, perfil, motivo };
}

export function carregarConfiguracao(ambiente: AmbienteBruto): ConfiguracaoRuntime {
  const perfil = resolverPerfil(ambiente);
  const capacidades = CAPACIDADES[perfil];
  const problemas: ProblemaConfiguracao[] = [];
  const canonico = contextoCanonico(perfil);

  const resolver = (nome: string): string | undefined => {
    const bruto = normalizar(ambiente[nome]);
    if (bruto !== undefined) return bruto;
    return descritorDe(nome)?.padraoPorPerfil?.[perfil];
  };

  const lerEnum = <T extends string>(nome: string, aceitos: readonly T[], falhaFechada: T): T => {
    const valor = resolver(nome);
    if (valor === undefined) return falhaFechada;
    if ((aceitos as readonly string[]).includes(valor)) return valor as T;
    problemas.push(
      problema(nome, perfil, `valor não reconhecido; valores aceitos: ${listar(aceitos)}.`),
    );
    return falhaFechada;
  };

  const lerBooleano = (nome: string, falhaFechada: boolean): boolean => {
    const valor = resolver(nome);
    if (valor === undefined) return falhaFechada;
    const minusculo = valor.toLowerCase();
    if (VERDADEIROS.has(minusculo)) return true;
    if (FALSOS.has(minusculo)) return false;
    problemas.push(problema(nome, perfil, 'valor não reconhecido; valores aceitos: "sim", "nao".'));
    return falhaFechada;
  };

  const lerInteiro = (
    nome: string,
    faixa: { readonly min: number; readonly max: number },
    falhaFechada: number,
  ): number => {
    const valor = resolver(nome);
    if (valor === undefined) return falhaFechada;
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < faixa.min || numero > faixa.max) {
      problemas.push(problema(nome, perfil, `inteiro esperado entre ${faixa.min} e ${faixa.max}.`));
      return falhaFechada;
    }
    return numero;
  };

  // --- modos: definem o que passa a ser obrigatório ---------------------------
  const bancoModo: ModoBanco = lerEnum("IC_BANCO_MODO", MODOS_BANCO, canonico.bancoModo);
  const identidadeModo: ModoIdentidade = lerEnum(
    "IC_IDENTIDADE_MODO",
    MODOS_IDENTIDADE,
    canonico.identidadeModo,
  );
  const contexto: ContextoRequisito = { perfil, bancoModo, identidadeModo };

  // --- obrigatoriedade, dirigida pela tabela ---------------------------------
  for (const descritor of DESCRITORES) {
    if (descritor.nome === "PERFIL") continue;
    if (!descritor.exigidaQuando(contexto)) continue;
    if (resolver(descritor.nome) === undefined) {
      problemas.push(
        problema(descritor.nome, perfil, "variável obrigatória ausente neste perfil."),
      );
    }
  }

  // --- capacidades do perfil (anti-padrão 9) ---------------------------------
  const semearFixturesSinteticas = lerBooleano("IC_BANCO_SEMEAR_FIXTURES", false);

  if (bancoModo === "pglite-memoria" && !capacidades.permitePGliteEmMemoria) {
    problemas.push(
      problema(
        "IC_BANCO_MODO",
        perfil,
        "PGlite em memória só é admitido em perfil sintético (test, dev-synthetic); " +
          'neste perfil o modo precisa ser "postgres".',
      ),
    );
  }
  if (semearFixturesSinteticas && !capacidades.semeaduraAutomaticaPermitida) {
    problemas.push(
      problema(
        "IC_BANCO_SEMEAR_FIXTURES",
        perfil,
        "semeadura de fixtures pelo bootstrap só é admitida em perfil sintético; neste " +
          "perfil a carga de dados é ato explícito do harness, fora do processo.",
      ),
    );
  }
  if (identidadeModo === "token-sintetico" && !capacidades.permiteTokenSintetico) {
    problemas.push(
      problema(
        "IC_IDENTIDADE_MODO",
        perfil,
        "token sintético só é admitido em perfil sintético; neste perfil o modo precisa " +
          'ser "oidc". Não existe degradação de OIDC indisponível para token local.',
      ),
    );
  }

  // --- forma dos valores -----------------------------------------------------
  const url = resolver("IC_BANCO_URL");
  if (bancoModo === "postgres" && url !== undefined) {
    validarUrlBanco(problemas, perfil, url);
  }

  const usuario = resolver("IC_BANCO_USUARIO");
  if (
    bancoModo === "postgres" &&
    usuario !== undefined &&
    PAPEIS_PROIBIDOS.has(usuario.toLowerCase())
  ) {
    problemas.push(
      problema(
        "IC_BANCO_USUARIO",
        perfil,
        "papel notoriamente privilegiado; a aplicação precisa conectar como papel de " +
          "aplicação sem SUPERUSER/BYPASSRLS e com credencial própria (ADR-0016 §4.1).",
      ),
    );
  }

  const senhaBruta = resolver("IC_BANCO_SENHA");
  const emissor = resolver("IC_IDENTIDADE_EMISSOR");
  const audiencia = resolver("IC_IDENTIDADE_AUDIENCIA");
  const jwksUrl = resolver("IC_IDENTIDADE_JWKS_URL");
  if (identidadeModo === "oidc") {
    validarUrlHttps(problemas, perfil, "IC_IDENTIDADE_EMISSOR", emissor);
    validarUrlHttps(problemas, perfil, "IC_IDENTIDADE_JWKS_URL", jwksUrl);
  }

  const porta = lerInteiro("PORT", { min: 1, max: 65_535 }, 3000);
  const migracaoModo: ModoMigracao = lerEnum(
    "IC_MIGRACAO_MODO",
    MODOS_MIGRACAO,
    capacidades.classe === "produtivo" ? "verificar" : "aplicar",
  );
  const timeoutMs = lerInteiro("IC_MIGRACAO_TIMEOUT_MS", { min: 1000, max: 600_000 }, 30_000);
  const lockId = lerInteiro("IC_MIGRACAO_LOCK_ID", { min: 0, max: 2_147_483_647 }, 20_260_817);
  const permitirDestrutiva = lerBooleano("IC_MIGRACAO_PERMITIR_DESTRUTIVA", false);
  const janelaCompatibilidade = lerInteiro(
    "IC_MIGRACAO_JANELA_COMPATIBILIDADE",
    { min: 1, max: 100 },
    5,
  );

  if (problemas.length > 0) throw new ErroDeConfiguracao(problemas);

  // --- montagem --------------------------------------------------------------
  const caminhoBundle = resolver("IC_BUNDLE_REGRA_CAMINHO");
  const chaveBundle = resolver("IC_BUNDLE_REGRA_CHAVE_PUBLICA");
  const bundleRegra: ConfiguracaoBundleRegra | null =
    caminhoBundle !== undefined && chaveBundle !== undefined
      ? Object.freeze({ caminho: caminhoBundle, chavePublica: chaveBundle })
      : null;

  const banner = construirBanner({
    perfil,
    bancoModo,
    semearFixturesSinteticas,
    identidadeModo,
    temBundleDeRegra: bundleRegra !== null,
  });
  const limitacoes = banner === null ? Object.freeze([]) : banner.limitacoes;

  const configuracao: ConfiguracaoRuntime = Object.freeze({
    perfil,
    classePerfil: capacidades.classe,
    porta,
    banco: Object.freeze({
      modo: bancoModo,
      url: bancoModo === "postgres" ? (url ?? null) : null,
      usuario: bancoModo === "postgres" ? (usuario ?? null) : null,
      senha: senhaBruta !== undefined && bancoModo === "postgres" ? new Segredo(senhaBruta) : null,
      semearFixturesSinteticas,
    }),
    identidade: Object.freeze({
      modo: identidadeModo,
      emissor: emissor ?? null,
      audiencia: audiencia ?? null,
      jwksUrl: jwksUrl ?? null,
    }),
    bundleRegra,
    migracao: Object.freeze({
      modo: migracaoModo,
      timeoutMs,
      lockId,
      permitirDestrutiva,
      janelaCompatibilidade,
    }),
    banner,
    limitacoes,
    modoDegradado: banner !== null,
  });

  // Guarda final: prova que o objeto montado satisfaz o schema declarado.
  // O retorno é o ORIGINAL congelado, não o clone do parse — ver `esquema.ts`.
  esquemaConfiguracaoRuntime.parse(configuracao);
  return configuracao;
}

/** Atalho para o bootstrap real do processo. */
export function carregarConfiguracaoDoAmbiente(): ConfiguracaoRuntime {
  return carregarConfiguracao(process.env);
}

function resolverPerfil(ambiente: AmbienteBruto): Perfil {
  const bruto = normalizar(ambiente.PERFIL);
  if (bruto === undefined) {
    throw new ErroDeConfiguracao([
      problema(
        "PERFIL",
        null,
        `variável obrigatória ausente — não há perfil padrão, por desenho. Valores aceitos: ${listar(PERFIS)}.`,
      ),
    ]);
  }
  if (!ehPerfil(bruto)) {
    throw new ErroDeConfiguracao([
      problema("PERFIL", null, `valor não reconhecido; valores aceitos: ${listar(PERFIS)}.`),
    ]);
  }
  return bruto;
}

function validarUrlBanco(problemas: ProblemaConfiguracao[], perfil: Perfil, valor: string): void {
  let analisada: URL;
  try {
    analisada = new URL(valor);
  } catch {
    problemas.push(
      problema(
        "IC_BANCO_URL",
        perfil,
        "não é uma URL válida (esperado postgres://host:porta/base).",
      ),
    );
    return;
  }
  if (!PROTOCOLOS_BANCO.has(analisada.protocol)) {
    problemas.push(
      problema("IC_BANCO_URL", perfil, 'protocolo inesperado; use "postgres" ou "postgresql".'),
    );
  }
  if (analisada.username.length > 0 || analisada.password.length > 0) {
    problemas.push(
      problema(
        "IC_BANCO_URL",
        perfil,
        "credencial embutida na URL. Usuário e senha vão em IC_BANCO_USUARIO e " +
          "IC_BANCO_SENHA: URL de conexão acaba em log, métrica e mensagem de erro " +
          "(anti-padrão 12).",
      ),
    );
  }
}

function validarUrlHttps(
  problemas: ProblemaConfiguracao[],
  perfil: Perfil,
  nome: string,
  valor: string | undefined,
): void {
  if (valor === undefined) return;
  let analisada: URL;
  try {
    analisada = new URL(valor);
  } catch {
    problemas.push(problema(nome, perfil, "não é uma URL válida."));
    return;
  }
  if (analisada.protocol !== "https:") {
    problemas.push(
      problema(
        nome,
        perfil,
        "esquema precisa ser https — material de identidade não trafega em claro.",
      ),
    );
  }
}
