/**
 * apps/api/src/auth/verificador.ts — VERIFICADOR ÚNICO de token.
 *
 * Este é o único ponto do sistema onde um token vira identidade. ADR-0015 §4
 * (Opção A, direção aceita GDEC-0016) exige exatamente isso: "um contrato
 * interno de contexto de identidade verificado e um verificador único que
 * aceita tokens OIDC (assinatura contra fonte de chave pinada, `iss`, `aud`,
 * `exp`, `sub`, `tenant`, `scope`), **sem qualquer caminho alternativo**".
 *
 * O adaptador sintético de dev/test e o adaptador OIDC usam ESTE código —
 * mudam a fonte de chaves, nunca a verificação (ADR-0015 §4 item 3: "stub
 * sintético com tenant no token, verificado pelo mesmo verificador de
 * produção").
 *
 * Ordem das verificações (deliberada, não acidental):
 *   forma → algoritmo → chave → coerência chave/algoritmo → ASSINATURA →
 *   emissor → audiência → janela temporal → sujeito → tenant → escopo →
 *   autorização da concessão.
 * Nada derivado do payload é usado antes da assinatura ser verificada.
 */

import {
  type AlgoritmoAceito,
  chaveCompativelComAlgoritmo,
  verificarAssinatura,
} from "./algoritmos.js";
import type { FonteDeChaves, ResultadoChave } from "./jwks.js";
import { decodificarJwsCompacto, type JwsDecodificado } from "./jws.js";
import {
  type CodigoFalhaAutenticacao,
  type ContextoAutenticado,
  ESCOPO_LEITURA_CLINICA_AMPLA,
  ESCOPO_WORKLOAD,
  falha,
  PAPEIS_RECONHECIDOS,
  type PapelClinico,
  PREFIXO_ESCOPO_TENANT,
  type ResultadoVerificacao,
  type TipoIdentidade,
} from "./tipos.js";

export interface ConfiguracaoVerificador {
  /** `iss` exigido — igualdade exata, nunca prefixo nem sufixo. */
  readonly emissor: string;
  readonly audiencia: string;
  readonly fonteDeChaves: FonteDeChaves;
  /** Restringe ainda mais a lista branca global de `algoritmos.ts`. */
  readonly algoritmosAceitos?: readonly AlgoritmoAceito[];
  /** Lista branca vinda da CONFIGURAÇÃO do servidor (ver `configuracao.ts`). */
  readonly tenantsPermitidos?: readonly string[];
  readonly toleranciaDeRelogioSegundos?: number;
  /** Relógio injetável em segundos — testes determinísticos, sem `vi.useFakeTimers`. */
  readonly agora?: () => number;
}

export interface Verificador {
  verificar(token: string): Promise<ResultadoVerificacao>;
  /** Disponível apenas quando a fonte de chaves não faz E/S. */
  readonly verificarSincrono?: (token: string) => ResultadoVerificacao;
}

/**
 * Grão de tenant aceito. ADR-0003 define o grão semântico (raiz de CNPJ); aqui
 * só se impõe a FORMA — identificador opaco, curto, sem espaço e sem caractere
 * que permita injeção em chave de cache, nome de canal SSE ou parâmetro de
 * sessão de banco (ADR-0016 §4.1, `TenantScopedKey`).
 */
const FORMA_DE_TENANT = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function recusa(codigo: CodigoFalhaAutenticacao): ResultadoVerificacao {
  return { ok: false, falha: falha(codigo) };
}

function textoNaoVazio(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim().length > 0 ? valor : undefined;
}

function audienciaContem(aud: unknown, esperada: string): boolean {
  if (typeof aud === "string") return aud === esperada;
  if (Array.isArray(aud)) return aud.some((v) => v === esperada);
  return false;
}

function lerEscopos(claims: Readonly<Record<string, unknown>>): readonly string[] | undefined {
  const bruto = claims.scope;
  if (typeof bruto === "string") {
    const partes = bruto.split(/\s+/).filter((p) => p.length > 0);
    return partes.length > 0 ? partes : undefined;
  }
  if (Array.isArray(bruto)) {
    const partes = bruto.filter((p): p is string => typeof p === "string" && p.length > 0);
    return partes.length > 0 ? partes : undefined;
  }
  return undefined;
}

function lerPapeis(claims: Readonly<Record<string, unknown>>): readonly PapelClinico[] {
  const bruto = claims.papeis;
  if (!Array.isArray(bruto)) return [];
  const reconhecidos = PAPEIS_RECONHECIDOS as readonly string[];
  // Papel não reconhecido é DESCARTADO, não aceito: menor privilégio. Rejeitar
  // o token inteiro daria a um IdP mal configurado o poder de derrubar o
  // acesso clínico inteiro por causa de um papel extra irrelevante.
  return bruto.filter((p): p is PapelClinico => typeof p === "string" && reconhecidos.includes(p));
}

function lerTipoDeIdentidade(
  claims: Readonly<Record<string, unknown>>,
  escopos: readonly string[],
): TipoIdentidade {
  const declarado = claims.tipo_identidade;
  if (declarado === "workload" || declarado === "usuario") return declarado;
  return escopos.includes(ESCOPO_WORKLOAD) ? "workload" : "usuario";
}

export function criarVerificadorDeToken(config: ConfiguracaoVerificador): Verificador {
  const tolerancia = config.toleranciaDeRelogioSegundos ?? 0;
  const agoraEmSegundos = config.agora ?? (() => Math.floor(Date.now() / 1000));
  const permitidos = config.tenantsPermitidos;

  /** Etapas anteriores à obtenção da chave. Nenhuma toca no payload. */
  function decodificar(
    token: string,
  ): { ok: true; jws: JwsDecodificado } | { ok: false; resultado: ResultadoVerificacao } {
    const decodificado = decodificarJwsCompacto(token);
    if (!decodificado.ok) return { ok: false, resultado: recusa(decodificado.codigo) };
    const { jws } = decodificado;
    if (
      config.algoritmosAceitos !== undefined &&
      !config.algoritmosAceitos.includes(jws.cabecalho.alg)
    ) {
      return { ok: false, resultado: recusa("algoritmo-nao-permitido") };
    }
    return { ok: true, jws };
  }

  /** Etapas posteriores: assinatura e, só então, claims. */
  function concluir(jws: JwsDecodificado, resultadoDaChave: ResultadoChave): ResultadoVerificacao {
    if (!resultadoDaChave.ok) return recusa(resultadoDaChave.codigo);
    const { chave } = resultadoDaChave;

    if (!chaveCompativelComAlgoritmo(chave, jws.cabecalho.alg)) {
      return recusa("familia-de-chave-incompativel");
    }
    if (!verificarAssinatura(jws.cabecalho.alg, jws.dadosAssinados, jws.assinatura, chave)) {
      return recusa("assinatura-invalida");
    }

    // ---- A partir daqui, e SÓ a partir daqui, o payload é confiável. ----
    const claims = jws.claims;

    if (claims.iss !== config.emissor) return recusa("emissor-invalido");
    if (!audienciaContem(claims.aud, config.audiencia)) return recusa("audiencia-invalida");

    const exp = claims.exp;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return recusa("expiracao-invalida");
    const agora = agoraEmSegundos();
    if (agora >= exp + tolerancia) return recusa("token-expirado");

    const nbf = claims.nbf;
    if (nbf !== undefined) {
      if (typeof nbf !== "number" || !Number.isFinite(nbf)) return recusa("token-ainda-nao-valido");
      if (agora + tolerancia < nbf) return recusa("token-ainda-nao-valido");
    }

    const iat = claims.iat;
    if (iat !== undefined) {
      if (typeof iat !== "number" || !Number.isFinite(iat))
        return recusa("token-emitido-no-futuro");
      if (iat > agora + tolerancia) return recusa("token-emitido-no-futuro");
    }

    const sub = textoNaoVazio(claims.sub);
    if (sub === undefined) return recusa("sujeito-ausente");

    const tenantBruto = claims.tenant;
    if (typeof tenantBruto !== "string" || tenantBruto.trim().length === 0) {
      return recusa("tenant-ausente");
    }
    if (!FORMA_DE_TENANT.test(tenantBruto)) return recusa("tenant-malformado");
    const tenantId = tenantBruto;

    const escopos = lerEscopos(claims);
    if (escopos === undefined) return recusa("escopo-ausente");

    // ---- Autorização da concessão (ADR-0016 §4.1) ----
    // O escopo `tenant:<id>` é a afirmação do EMISSOR sobre a que tenant a
    // concessão se aplica. Divergir da claim `tenant` significa token
    // remontado ou mal emitido — negar, nunca escolher um dos dois.
    const tenantsNoEscopo = escopos
      .filter((e) => e.startsWith(PREFIXO_ESCOPO_TENANT))
      .map((e) => e.slice(PREFIXO_ESCOPO_TENANT.length));
    if (tenantsNoEscopo.length > 0 && tenantsNoEscopo.some((t) => t !== tenantId)) {
      return recusa("tenant-divergente-do-escopo");
    }

    // Único valor da decisão que NÃO se origina no chamador (anti-padrão
    // §10.4 do prompt: não autorizar comparando dois valores do mesmo lado).
    if (permitidos !== undefined && !permitidos.includes(tenantId)) {
      return recusa("tenant-nao-autorizado");
    }

    const tipoIdentidade = lerTipoDeIdentidade(claims, escopos);
    if (tipoIdentidade === "workload" && escopos.includes(ESCOPO_LEITURA_CLINICA_AMPLA)) {
      return recusa("workload-com-escopo-clinico-amplo");
    }

    const contexto: ContextoAutenticado = {
      tenantId,
      atorId: sub,
      tipoIdentidade,
      papeis: lerPapeis(claims),
      escopos,
      finalidade: textoNaoVazio(claims.purpose),
      emissor: config.emissor,
      expiraEm: exp,
      idSessao: textoNaoVazio(claims.jti),
    };
    return { ok: true, contexto };
  }

  const fonteSincrona = config.fonteDeChaves.obterChaveSincrono;

  const verificador: Verificador = {
    async verificar(token: string): Promise<ResultadoVerificacao> {
      const inicial = decodificar(token);
      if (!inicial.ok) return inicial.resultado;
      const chave = await config.fonteDeChaves.obterChave(inicial.jws.cabecalho.kid);
      return concluir(inicial.jws, chave);
    },
    ...(fonteSincrona === undefined
      ? {}
      : {
          verificarSincrono: (token: string): ResultadoVerificacao => {
            const inicial = decodificar(token);
            if (!inicial.ok) return inicial.resultado;
            return concluir(inicial.jws, fonteSincrona(inicial.jws.cabecalho.kid));
          },
        }),
  };
  return verificador;
}
