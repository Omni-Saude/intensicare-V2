/**
 * apps/web/src/api/resolverCliente.ts
 *
 * Resolve QUAL cliente de API a casca do app usa, e com qual sessão.
 *
 * POR QUE É ASSÍNCRONO (ACH-07). O cliente mock e a sessão sintética são
 * alcançados por `import()` DINÂMICO dentro de um ramo guardado por
 * `import.meta.env.DEV`. O Vite substitui essa expressão por `false` no build
 * de produção; o ramo inteiro vira código morto e o empacotador remove os
 * módulos do pacote emitido. Resultado: em build não-dev o dublê não é
 * "bloqueado em runtime" — ele NÃO ESTÁ LÁ. A guarda de runtime
 * (`exigirPerfilDesenvolvimento`) continua existindo como segunda defesa,
 * para o caso de o ramo sobreviver a uma configuração de build inesperada.
 *
 * ORDEM DELIBERADA das decisões:
 *   1. perfil (dev × não-dev) — decide se o dublê sequer existe;
 *   2. `?mock` — só é considerado DEPOIS, e em não-dev provoca recusa;
 *   3. sessão — o cliente HTTP nunca é criado sem provedor.
 *
 * Inverter (1) e (2) seria o erro clássico: avaliar o pedido do usuário antes
 * da política, e então precisar lembrar de negá-lo.
 *
 * Rastreio: ACH-07, ADR-0015, ADR-0021, anti-padrões 8 e 9 do contrato comum.
 */
import {
  type AmbienteBuild,
  ambienteAtual,
  ehPerfilDesenvolvimento,
  exigirPerfilDesenvolvimento,
  pedeClienteMock,
} from "../perfil.js";
import { criarClienteHttp } from "./clienteHttp.js";
import { criarSessaoAusente, type ProvedorSessao } from "./sessao.js";
import type { ClienteApiIntensiCare } from "./tipos.js";

export interface OpcoesResolucaoCliente {
  /** `window.location.search` (ou equivalente em teste). */
  readonly busca: string;
  /** Ambiente do build. Injetável para tornar o caminho não-dev testável. */
  readonly ambiente?: AmbienteBuild;
  /** Provedor de sessão explícito. Quando ausente, é escolhido pelo perfil. */
  readonly sessao?: ProvedorSessao;
}

export interface ClienteResolvido {
  readonly cliente: ClienteApiIntensiCare;
  readonly sessao: ProvedorSessao;
  /** Origem efetiva — exibida na casca do app, nunca escondida do revisor. */
  readonly origem: "http" | "mock-desenvolvimento";
}

/**
 * Resolve cliente e sessão. LANÇA `RecusaDePerfilError` quando `?mock` é
 * pedido fora de desenvolvimento — a casca do app converte essa exceção numa
 * tela de recusa explícita (recusa OBSERVÁVEL, não um log silencioso).
 */
export async function resolverCliente(opcoes: OpcoesResolucaoCliente): Promise<ClienteResolvido> {
  const ambiente = opcoes.ambiente ?? ambienteAtual();
  const querMock = pedeClienteMock(opcoes.busca);

  if (import.meta.env.DEV && ehPerfilDesenvolvimento(ambiente)) {
    const { criarSessaoSinteticaDeDesenvolvimento } = await import("./sessaoDesenvolvimento.js");
    const sessao = opcoes.sessao ?? criarSessaoSinteticaDeDesenvolvimento({ ambiente });

    if (querMock) {
      const { criarClienteMock } = await import("./clienteMock.js");
      return { cliente: criarClienteMock(ambiente), sessao, origem: "mock-desenvolvimento" };
    }
    return { cliente: criarClienteHttp({ sessao }), sessao, origem: "http" };
  }

  // Perfil não-dev. `?mock` aqui é recusa, não degradação.
  if (querMock) {
    exigirPerfilDesenvolvimento("cliente mock (?mock)", ambiente);
  }

  // Sem provedor real de sessão, `criarSessaoAusente` faz o cliente recusar
  // com estado `proibido` visível — jamais uma requisição anônima.
  const sessao = opcoes.sessao ?? criarSessaoAusente();
  return { cliente: criarClienteHttp({ sessao }), sessao, origem: "http" };
}
