/**
 * apps/api/src/auth/servidor-oidc-de-teste.ts — emissor e servidor OIDC/JWKS
 * LOCAIS, exclusivos de dev/test.
 *
 * Por que existem: nenhum IdP foi selecionado (ADR-0015 §1, `threat-model.md`
 * §2.2 — a fronteira TB-06 não está decidida) e o prompt §3 regra 14 proíbe
 * escolher tecnologia por herança. Sem um emissor verificável, o adaptador
 * OIDC só poderia ser "testado" contra si mesmo. Este módulo fecha essa
 * lacuna: gera par de chaves EM RUNTIME, serve um JWKS real por HTTP e emite
 * tokens assinados de verdade, permitindo exercitar rotação, `kid`
 * desconhecido e indisponibilidade da fonte de chaves.
 *
 * NENHUM material criptográfico é versionado — as chaves nascem e morrem no
 * processo (ADR-0017 fica intacta: nada aqui decide custódia de chave).
 *
 * CONTENÇÃO: as fábricas abaixo LANÇAM fora de `dev`/`test` (ADR-0015 §4.1 e
 * §5 "o stub sintético é uma superfície que não pode vazar para fora de
 * dev/test, e essa contenção vira um requisito de CI permanente").
 */

import { createHmac, generateKeyPairSync, type KeyObject, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo, Socket } from "node:net";
import type { AlgoritmoAceito } from "./algoritmos.js";
import { type PerfilExecucao, perfilDoAmbiente, perfilPermiteSintetico } from "./configuracao.js";
import type { ConjuntoDeChavesPublicas } from "./jwks.js";

/**
 * Guarda de contenção. Chamada por TODA fábrica deste módulo e pelo adaptador
 * sintético. `perfil` explícito vence; sem ele, deriva do ambiente — e
 * ambiente sem perfil declarado é tratado como NÃO-dev (fail-closed).
 */
export function exigirPerfilDeDesenvolvimento(
  perfil: PerfilExecucao | undefined = perfilDoAmbiente(),
  contexto = "recurso sintético de autenticação",
): PerfilExecucao {
  if (!perfilPermiteSintetico(perfil)) {
    throw new Error(
      `Contenção de identidade sintética (ADR-0015 §4.1): ${contexto} só pode ser instanciado sob perfil dev/test; perfil recebido: ${perfil ?? "não declarado"}.`,
    );
  }
  return perfil as PerfilExecucao;
}

export const EMISSOR_DE_TESTE_PADRAO = "https://emissor-sintetico.intensicare.invalid";
export const AUDIENCIA_DE_TESTE_PADRAO = "urn:intensicare:api:v1";

export interface OpcoesDeAssinatura {
  /** Assina em HS256 com este segredo — usado para provar recusa de confusão HS/RS. */
  readonly segredoHmac?: Buffer;
  /** Produz o token com o terceiro segmento vazio (`alg: none` clássico). */
  readonly semAssinatura?: boolean;
}

export interface OpcoesDoEmissorDeTeste {
  readonly emissor?: string;
  readonly audiencia?: string;
  readonly algoritmo?: AlgoritmoAceito;
  readonly perfil?: PerfilExecucao;
}

export interface EmissorDeTeste {
  readonly emissor: string;
  readonly audiencia: string;
  readonly algoritmo: AlgoritmoAceito;
  readonly kid: string;
  /** JWKS público das chaves ATIVAS (a rotação retira a anterior). */
  jwks(): ConjuntoDeChavesPublicas;
  /** Token válido; `sobrescritas` substitui claims (valor `undefined` remove a claim). */
  emitir(sobrescritas?: Readonly<Record<string, unknown>>): string;
  /** Cabeçalho JOSE e claims arbitrários — a ferramenta dos casos adversariais. */
  emitirBruto(
    cabecalho: Readonly<Record<string, unknown>>,
    claims: Readonly<Record<string, unknown>>,
    opcoes?: OpcoesDeAssinatura,
  ): string;
  /** Gera novo par; o `kid` anterior some do JWKS. */
  rotacionar(): void;
  /** Chave pública em DER/SPKI — segredo do teste de confusão HS/RS. */
  chavePublicaEmSpki(): Buffer;
}

interface Par {
  readonly kid: string;
  readonly privada: KeyObject;
  readonly publica: KeyObject;
}

function gerarPar(algoritmo: AlgoritmoAceito): Par {
  const kid = `SYNTH-KID-${randomUUID()}`;
  if (algoritmo.startsWith("ES")) {
    const curva =
      algoritmo === "ES384" ? "secp384r1" : algoritmo === "ES512" ? "secp521r1" : "prime256v1";
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: curva });
    return { kid, privada: privateKey, publica: publicKey };
  }
  if (algoritmo === "EdDSA") {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    return { kid, privada: privateKey, publica: publicKey };
  }
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return { kid, privada: privateKey, publica: publicKey };
}

function b64url(valor: Readonly<Record<string, unknown>>): string {
  return Buffer.from(JSON.stringify(valor), "utf8").toString("base64url");
}

function assinarComPar(algoritmo: AlgoritmoAceito, dados: Buffer, par: Par): Buffer {
  if (algoritmo === "EdDSA") return sign(null, dados, par.privada);
  const hash = algoritmo.endsWith("384")
    ? "sha384"
    : algoritmo.endsWith("512")
      ? "sha512"
      : "sha256";
  if (algoritmo.startsWith("ES")) {
    return sign(hash, dados, { key: par.privada, dsaEncoding: "ieee-p1363" });
  }
  return sign(hash, dados, par.privada);
}

export function criarEmissorDeTeste(opcoes: OpcoesDoEmissorDeTeste = {}): EmissorDeTeste {
  exigirPerfilDeDesenvolvimento(opcoes.perfil ?? perfilDoAmbiente(), "emissor OIDC de teste");

  const algoritmo: AlgoritmoAceito = opcoes.algoritmo ?? "ES256";
  const emissor = opcoes.emissor ?? EMISSOR_DE_TESTE_PADRAO;
  const audiencia = opcoes.audiencia ?? AUDIENCIA_DE_TESTE_PADRAO;
  let par = gerarPar(algoritmo);

  function claimsPadrao(): Record<string, unknown> {
    const agora = Math.floor(Date.now() / 1000);
    return {
      iss: emissor,
      aud: audiencia,
      sub: "SYNTH-PROFISSIONAL-01",
      tenant: "SYNTH-TENANT-G7",
      scope: "clinico:leitura clinico:acao tenant:SYNTH-TENANT-G7",
      papeis: ["atuante-clinico"],
      // Vocabulário de finalidade é matéria de privacidade e está
      // VALIDATION REQUIRED (ADR-0015 §6) — valor sintético, não normativo.
      purpose: "SYNTH-FINALIDADE-CUIDADO-DIRETO",
      iat: agora,
      nbf: agora,
      exp: agora + 3600,
      jti: `SYNTH-JTI-${randomUUID()}`,
    };
  }

  function emitirBruto(
    cabecalho: Readonly<Record<string, unknown>>,
    claims: Readonly<Record<string, unknown>>,
    opcoesDeAssinatura: OpcoesDeAssinatura = {},
  ): string {
    const dados = Buffer.from(`${b64url(cabecalho)}.${b64url(claims)}`, "ascii");
    if (opcoesDeAssinatura.semAssinatura === true) return `${dados.toString("ascii")}.`;
    const assinatura =
      opcoesDeAssinatura.segredoHmac !== undefined
        ? createHmac("sha256", opcoesDeAssinatura.segredoHmac).update(dados).digest()
        : assinarComPar(algoritmo, dados, par);
    return `${dados.toString("ascii")}.${assinatura.toString("base64url")}`;
  }

  return {
    emissor,
    audiencia,
    algoritmo,
    get kid() {
      return par.kid;
    },
    jwks: (): ConjuntoDeChavesPublicas => ({
      keys: [
        {
          ...(par.publica.export({ format: "jwk" }) as Record<string, unknown>),
          kid: par.kid,
          use: "sig",
          alg: algoritmo,
        },
      ],
    }),
    emitir: (sobrescritas = {}) =>
      emitirBruto(
        { alg: algoritmo, typ: "JWT", kid: par.kid },
        { ...claimsPadrao(), ...sobrescritas },
      ),
    emitirBruto,
    rotacionar: () => {
      par = gerarPar(algoritmo);
    },
    chavePublicaEmSpki: () => Buffer.from(par.publica.export({ type: "spki", format: "der" })),
  };
}

export type ModoDeFalhaDoJwks = "nenhum" | "http-500" | "corpo-invalido" | "silencio";

export interface ServidorOidcDeTeste {
  readonly emissorDeTeste: EmissorDeTeste;
  readonly baseUrl: string;
  readonly jwksUri: string;
  readonly configuracaoUri: string;
  /** Quantos GET ao JWKS chegaram — prova de cache e do limite de re-busca. */
  buscasAoJwks(): number;
  definirModoDeFalha(modo: ModoDeFalhaDoJwks): void;
  fechar(): Promise<void>;
}

/**
 * Sobe um servidor OIDC mínimo em loopback com porta efêmera. Serve
 * `/.well-known/openid-configuration` e `/jwks.json`. Não implementa fluxo de
 * autorização: o alvo do teste é o VERIFICADOR, não o fluxo do IdP.
 */
export async function criarServidorOidcDeTeste(
  opcoes: OpcoesDoEmissorDeTeste = {},
): Promise<ServidorOidcDeTeste> {
  exigirPerfilDeDesenvolvimento(opcoes.perfil ?? perfilDoAmbiente(), "servidor OIDC de teste");

  let modo: ModoDeFalhaDoJwks = "nenhum";
  let buscas = 0;
  const socketsPendurados = new Set<Socket>();

  // O emissor precisa do `iss` final (com a porta), então é criado depois do
  // `listen`; até lá, uma referência mutável.
  let emissorDeTeste: EmissorDeTeste | undefined;

  const servidor: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const caminho = (req.url ?? "/").split("?")[0];
    if (caminho === "/jwks.json") {
      buscas += 1;
      if (modo === "silencio") {
        socketsPendurados.add(res.socket as Socket);
        return; // deliberadamente sem resposta: exercita o tempo limite.
      }
      if (modo === "http-500") {
        res.writeHead(500, { "content-type": "application/json" });
        res.end('{"erro":"indisponivel"}');
        return;
      }
      if (modo === "corpo-invalido") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end("isto-nao-e-json");
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(emissorDeTeste?.jwks() ?? { keys: [] }));
      return;
    }
    if (caminho === "/.well-known/openid-configuration") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          issuer: emissorDeTeste?.emissor,
          jwks_uri: `${baseUrl}/jwks.json`,
          id_token_signing_alg_values_supported: [emissorDeTeste?.algoritmo],
        }),
      );
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end('{"erro":"nao-encontrado"}');
  });

  await new Promise<void>((resolver) => servidor.listen(0, "127.0.0.1", resolver));
  const endereco = servidor.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${endereco.port}`;

  emissorDeTeste = criarEmissorDeTeste({
    ...opcoes,
    emissor: opcoes.emissor ?? baseUrl,
  });

  return {
    emissorDeTeste,
    baseUrl,
    jwksUri: `${baseUrl}/jwks.json`,
    configuracaoUri: `${baseUrl}/.well-known/openid-configuration`,
    buscasAoJwks: () => buscas,
    definirModoDeFalha: (novo) => {
      modo = novo;
    },
    fechar: async () => {
      for (const socket of socketsPendurados) socket.destroy();
      socketsPendurados.clear();
      await new Promise<void>((resolver) => servidor.close(() => resolver()));
    },
  };
}
