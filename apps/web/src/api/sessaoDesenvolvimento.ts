/**
 * apps/web/src/api/sessaoDesenvolvimento.ts
 *
 * MÓDULO EXCLUSIVO DE DESENVOLVIMENTO. Implementa `ProvedorSessao` obtendo o
 * bearer de `POST /v1/dev/sessao` — o endpoint que a API expõe SOMENTE onde o
 * perfil admite adaptador sintético (em perfil endurecido a rota não existe:
 * 404, não 403).
 *
 * POR QUE DEIXOU DE HAVER TOKEN LITERAL AQUI. Até o ACH-07 este módulo
 * carregava a constante `SYNTH-TOKEN.SYNTH-TENANT-G7.SYNTH-PROFISSIONAL-WEB`.
 * A autenticação do backend passou a ser JWS ASSINADO e a chave do emissor
 * sintético é gerada em memória POR PROCESSO — nenhum token cunhado fora do
 * processo da API é verificável por ela. Uma constante de build (ou um
 * `VITE_TOKEN_DEV` fixo) seria rejeitada com 401 desde a primeira chamada, e
 * ainda expiraria: o `exp` emitido é de 1 hora. O token PRECISA ser obtido em
 * runtime, do próprio processo que vai verificá-lo.
 *
 * REGRAS QUE ESTE MÓDULO IMPÕE:
 *
 *   D1. O token vive APENAS em memória do módulo. Nunca `localStorage`, nunca
 *       `sessionStorage`, nunca cookie, nunca query string, nunca log — um
 *       bearer em armazenamento persistente sobrevive à aba e vira credencial
 *       esquecida (anti-padrão 12 do contrato comum). Há teste que afirma que
 *       nenhum armazenamento do navegador é tocado.
 *   D2. Renovação é ANTECIPADA: o token é trocado antes de `expiraEm`, com
 *       margem. Esperar o 401 para renovar transformaria toda expiração numa
 *       falha visível ao usuário.
 *   D3. Renovações concorrentes são DEDUPLICADAS. Três telas montando ao mesmo
 *       tempo não podem emitir três sessões.
 *   D4. Existe FREIO DE LAÇO. Se um 401 chega logo depois de uma renovação, o
 *       token recém-emitido está sendo rejeitado — renovar de novo seria um
 *       laço infinito contra a API. A sessão passa a `expirada` e para.
 *   D5. Resposta malformada NÃO é aceita. Sem `token` utilizável ou sem
 *       `expiraEm` interpretável, nenhuma credencial é usada — fail-closed.
 *   D6. 404 é PERMANENTE. Significa "este perfil não emite sessão sintética";
 *       repetir a chamada não muda isso.
 *   D7. A renovação NÃO usa o `AbortSignal` de quem a pediu. Sendo
 *       compartilhada (D3), atrelá-la a um chamador faz o cancelamento de um
 *       derrubar a emissão de todos.
 *   D8. A renovação NUNCA propaga exceção. Falha ao emitir é "sem
 *       credencial", não "erro de carregamento da tela".
 *
 * Rastreio: ADR-0015, ADR-0021, ACH-07, anti-padrões 8, 9 e 12 do contrato comum.
 */
import type { EstadoSessao } from "../domain/estados.js";
import { type AmbienteBuild, ambienteAtual, exigirPerfilDesenvolvimento } from "../perfil.js";
import type { ProvedorSessao } from "./sessao.js";

/** Caminho do emissor de sessão sintética. Dev-only, por desenho da API. */
export const CAMINHO_SESSAO_DESENVOLVIMENTO = "/v1/dev/sessao";

/** Renova com esta antecedência sobre `expiraEm` (D2). */
const MARGEM_RENOVACAO_MS = 5 * 60 * 1000;

/**
 * Se um 401 chega dentro desta janela após uma renovação, o token novo está
 * sendo rejeitado — não é expiração (D4). Uma expiração legítima acontece
 * ~1 h depois da emissão, não em segundos.
 */
const JANELA_SUSPEITA_APOS_RENOVACAO_MS = 30 * 1000;

/** Forma da resposta de `POST /v1/dev/sessao`. */
interface RespostaSessaoDesenvolvimento {
  readonly token: string;
  readonly expiraEm: string;
}

export interface OpcoesSessaoDesenvolvimento {
  readonly ambiente?: AmbienteBuild;
  /** Prefixo da URL. Vazio no navegador (o proxy do Vite roteia `/v1/*`). */
  readonly baseUrl?: string;
  /** `fetch` injetável — torna a renovação testável sem servidor. */
  readonly fetchImpl?: typeof fetch;
  /** Relógio injetável, em ms. */
  readonly agoraMs?: () => number;
  readonly margemRenovacaoMs?: number;
}

function ehRespostaValida(corpo: unknown): corpo is RespostaSessaoDesenvolvimento {
  if (typeof corpo !== "object" || corpo === null) return false;
  const candidato = corpo as Partial<RespostaSessaoDesenvolvimento>;
  return (
    typeof candidato.token === "string" &&
    candidato.token.length > 0 &&
    typeof candidato.expiraEm === "string" &&
    Number.isFinite(Date.parse(candidato.expiraEm))
  );
}

/**
 * Cria a sessão sintética de desenvolvimento. LANÇA `RecusaDePerfilError`
 * fora de desenvolvimento — não existe caminho de degradação.
 */
export function criarSessaoSinteticaDeDesenvolvimento(
  opcoes: OpcoesSessaoDesenvolvimento = {},
): ProvedorSessao {
  const ambiente = opcoes.ambiente ?? ambienteAtual();
  exigirPerfilDesenvolvimento("sessão sintética de desenvolvimento", ambiente);

  const baseUrl = opcoes.baseUrl ?? "";
  const agoraMs = opcoes.agoraMs ?? (() => Date.now());
  const margemMs = opcoes.margemRenovacaoMs ?? MARGEM_RENOVACAO_MS;
  const executarFetch: typeof fetch =
    opcoes.fetchImpl ?? ((entrada, inicio) => globalThis.fetch(entrada, inicio));

  // D1: estado APENAS em memória do módulo.
  let token: string | null = null;
  let expiraEmMs: number | null = null;
  let estado: EstadoSessao = "ativa";
  let renovadoEmMs: number | null = null;
  let renovacaoEmVoo: Promise<string | null> | null = null;

  const ouvintes = new Set<(estado: EstadoSessao) => void>();

  function definirEstado(novo: EstadoSessao): void {
    if (estado === novo) return;
    estado = novo;
    for (const ouvinte of ouvintes) ouvinte(estado);
  }

  function descartarToken(): void {
    token = null;
    expiraEmMs = null;
  }

  /** `true` quando há token utilizável e ainda longe da margem de renovação. */
  function tokenUtilizavel(): boolean {
    return token !== null && expiraEmMs !== null && agoraMs() < expiraEmMs - margemMs;
  }

  /**
   * D7. A renovação NÃO recebe o `AbortSignal` de quem a pediu.
   *
   * DEFEITO REAL CORRIGIDO AQUI (encontrado pela suíte de navegador). A versão
   * anterior repassava o sinal do primeiro chamador ao `fetch` de emissão.
   * Como a renovação é COMPARTILHADA (D3), o cancelamento de UM chamador
   * derrubava a emissão para TODOS os outros, que herdavam a rejeição de
   * aborto. Em React StrictMode isso acontece sempre: o efeito monta, é
   * desmontado de propósito e remonta — o primeiro sinal é abortado, e a
   * segunda montagem recebia `AbortError` de uma requisição que ela não
   * cancelou. A tela terminava em `erro` ("Não foi possível carregar") em vez
   * de `proibido`, atribuindo à rede uma falha de autenticação.
   *
   * A emissão de sessão é infraestrutura compartilhada e de vida curta: ela
   * não pertence a nenhuma tela, e nenhuma tela pode cancelá-la.
   */
  async function renovar(): Promise<string | null> {
    const resposta = await executarFetch(`${baseUrl}${CAMINHO_SESSAO_DESENVOLVIMENTO}`, {
      method: "POST",
      headers: { accept: "application/json" },
      // Sem corpo: a rota NÃO aceita entrada. Tenant e ator são os do cenário
      // sintético semeado, escolhidos pela API — jamais pelo chamador.
    });

    if (resposta.status === 404) {
      // D6: este perfil não emite sessão sintética. Permanente.
      definirEstado("expirada");
      return null;
    }
    if (!resposta.ok) {
      // Falha transitória (500/503): não marca expirada — o cliente HTTP
      // renderiza `proibido` e uma nova tentativa do usuário repete a emissão.
      return null;
    }

    const corpo: unknown = await resposta.json().catch(() => null);
    if (!ehRespostaValida(corpo)) {
      // D5: fail-closed. Um corpo que não traz token e validade utilizáveis
      // não vira credencial "quase boa".
      return null;
    }

    token = corpo.token;
    expiraEmMs = Date.parse(corpo.expiraEm);
    renovadoEmMs = agoraMs();
    definirEstado("ativa");
    return token;
  }

  return {
    estadoAtual: () => {
      if (estado === "expirada") return "expirada";
      // `expirando` é derivado de `expiraEm` DA API — fato do backend, não
      // contagem de tempo inventada pelo frontend.
      if (token !== null && expiraEmMs !== null && agoraMs() >= expiraEmMs - margemMs) {
        return "expirando";
      }
      return estado;
    },

    async cabecalhoAutorizacao(_sinal?: AbortSignal): Promise<string | null> {
      if (estado === "expirada") return null;
      if (tokenUtilizavel()) return `Bearer ${token}`;

      // D3: uma renovação por vez, compartilhada por todos os chamadores.
      // D7: sem o sinal do chamador — ver a nota em `renovar`.
      renovacaoEmVoo ??= renovar()
        // D8: a renovação NUNCA propaga exceção para o chamador. Uma falha de
        // rede na emissão é "não há credencial" (o cliente HTTP renderiza
        // `proibido`), não um erro de carregamento da tela clínica. Sem este
        // `catch`, uma rejeição aqui subiria até o hook de recurso e a tela
        // diria "Não foi possível carregar" — atribuindo à rede uma falha de
        // autenticação.
        .catch(() => null)
        .finally(() => {
          renovacaoEmVoo = null;
        });

      const novo = await renovacaoEmVoo;
      return novo === null ? null : `Bearer ${novo}`;
    },

    registrarRespostaNaoAutorizada: (status: number) => {
      if (status !== 401) return;

      const agora = agoraMs();
      const logoAposRenovacao =
        renovadoEmMs !== null && agora - renovadoEmMs < JANELA_SUSPEITA_APOS_RENOVACAO_MS;

      descartarToken();

      if (logoAposRenovacao) {
        // D4: o token recém-emitido foi rejeitado. Renovar de novo seria um
        // laço contra a API, e mascararia uma falha de autorização real como
        // lentidão. A sessão para aqui, visivelmente.
        definirEstado("expirada");
        return;
      }

      // Expiração normal: o próximo `cabecalhoAutorizacao` renova sozinho.
      definirEstado("recuperada");
    },

    assinar: (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
