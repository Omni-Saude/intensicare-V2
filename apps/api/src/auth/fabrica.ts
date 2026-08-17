/**
 * apps/api/src/auth/fabrica.ts — construção da porta a partir da configuração.
 *
 * Esta função é o ponto que o teste de aceite do ADR-0015 §8 V5 mira: "o
 * emissor sintético não é habilitável fora de `dev`/`test` — teste de
 * inicialização por perfil (deve FALHAR ao iniciar)". Ela LANÇA; não devolve
 * uma porta degradada, não registra aviso e segue, não desabilita rotas.
 */

import { criarAdaptadorOidc } from "./adaptador-oidc.js";
import { criarAdaptadorSintetico } from "./adaptador-sintetico.js";
import { type ConfiguracaoAutenticacao, PERFIS, perfilPermiteSintetico } from "./configuracao.js";
import type { PortaDeAutenticacao } from "./porta.js";

export function criarPortaDeAutenticacao(config: ConfiguracaoAutenticacao): PortaDeAutenticacao {
  if (!(PERFIS as readonly string[]).includes(config.perfil)) {
    throw new Error(
      `Configuração de autenticação inválida: perfil "${String(config.perfil)}" não é um perfil conhecido (${PERFIS.join(", ")}).`,
    );
  }

  const ehDesenvolvimento = perfilPermiteSintetico(config.perfil);

  // Contenção positiva: em perfil não-dev, a mera PRESENÇA de configuração
  // sintética é falha de inicialização, mesmo que o adaptador escolhido seja
  // o OIDC. Configuração sintética esquecida em produção é como o token fixo
  // do legado — some do radar até o dia em que alguém troca o adaptador.
  if (!ehDesenvolvimento && config.sintetico !== undefined) {
    throw new Error(
      `Contenção de identidade sintética (ADR-0015 §4.1): bloco \`sintetico\` presente em perfil "${config.perfil}". Remova-o — em perfil não-dev ele não pode existir nem inativo.`,
    );
  }

  if (config.adaptador === "sintetico") {
    // `criarAdaptadorSintetico` repete a guarda; a duplicação é intencional —
    // a contenção não pode depender de quem chama.
    return criarAdaptadorSintetico(config);
  }
  if (config.adaptador === "oidc") {
    return criarAdaptadorOidc(config);
  }
  throw new Error(
    `Configuração de autenticação inválida: adaptador "${String(config.adaptador)}" desconhecido. Não existe default — a escolha é explícita.`,
  );
}
