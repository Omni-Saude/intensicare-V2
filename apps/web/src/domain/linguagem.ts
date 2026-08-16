/**
 * apps/web/src/domain/linguagem.ts
 *
 * Módulo de linguagem — a camada de apresentação dona do texto pt-BR
 * (ADR-0021 F1/F3, direção aceita em GDEC-0016). Cada função aqui é uma
 * TRADUÇÃO TOTAL (switch exaustivo, nunca um `default` silencioso) de um
 * identificador de estado (`./estados.ts`, "vem do backend" na forma real
 * — ver nota de integração pendente lá) para texto pt-BR + tom semântico.
 *
 * Regras que este módulo NUNCA viola (ADR-0021 F3):
 *   - nunca suprime a exibição de um estado;
 *   - nunca promove/rebaixa severidade;
 *   - nunca infere um estado que o identificador de entrada não contém.
 * Cada mapeamento é 1:1 e total — adicionar um novo valor ao union type em
 * `./estados.ts` quebra a compilação aqui (switch exaustivo) até que este
 * arquivo seja atualizado, por desenho.
 *
 * As escolhas de redação abaixo seguem a "lista semente de ambiguidade
 * proibida" da ADR-0029 §4 Opção A (P1-P9) — citada por item onde
 * aplicável. Nenhum termo aqui é uma ratificação formal de glossário
 * (isso pertence ao processo da ADR-0029, condição C2, ainda ABERTA);
 * este é texto provisório de fatia sintética, sujeito a revisão.
 */
import {
  type BandaRisco,
  casoImpossivel,
  type EstadoAvaliacao,
  type EstadoCarregamento,
  type EstadoConectividade,
  type EstadoFrescor,
  type EstadoItemTrabalho,
  type Tom,
} from "./estados.js";

/** Par texto+tom retornado por toda função de tradução deste módulo. */
export interface TextoComTom {
  texto: string;
  tom: Tom;
}

export function textoCarregamento(estado: EstadoCarregamento): TextoComTom {
  switch (estado) {
    case "carregando":
      return { texto: "Carregando…", tom: "neutro" };
    case "vazio":
      return { texto: "Nenhum item encontrado.", tom: "neutro" };
    case "indisponivel":
      return { texto: "Indisponível no momento — não foi possível obter os dados.", tom: "alerta" };
    case "proibido":
      return { texto: "Acesso não autorizado a este recurso.", tom: "alerta" };
    case "tempo_esgotado":
      return { texto: "Tempo de resposta esgotado.", tom: "atencao" };
    case "retentando":
      return { texto: "Tentando novamente…", tom: "atencao" };
    case "parcial":
      // P7 (ADR-0029): "parcial" nunca é redigido como "quase completo".
      return {
        texto: "Carregado parcialmente — alguns itens podem estar ausentes.",
        tom: "atencao",
      };
    case "pronto":
      return { texto: "Carregado.", tom: "neutro" };
    case "erro":
      return { texto: "Não foi possível carregar. Tente novamente.", tom: "alerta" };
    default:
      return casoImpossivel(estado, "textoCarregamento");
  }
}

export function textoFrescor(estado: EstadoFrescor): TextoComTom {
  switch (estado) {
    case "atual":
      return { texto: "Dado atual.", tom: "positivo" };
    case "envelhecendo":
      return {
        texto: "Dado envelhecendo — aproximando-se do limite de frescor esperado.",
        tom: "atencao",
      };
    case "desatualizado":
      // P8 (ADR-0029): "desatualizado" (stale) é distinto de "ausente" (missing).
      return {
        texto: "Dado desatualizado (obsoleto) — não reflete necessariamente o estado atual.",
        tom: "alerta",
      };
    case "expirado":
      return { texto: "Dado expirado — fora da janela de validade.", tom: "critico" };
    case "ausente":
      // P8 (ADR-0029): "ausente" (missing) é distinto de "desatualizado" (stale).
      return { texto: "Dado indisponível — nenhuma leitura recebida.", tom: "inconclusivo" };
    case "invalido":
      return { texto: "Dado inválido — não utilizável para cálculo.", tom: "inconclusivo" };
    case "conflitante":
      return { texto: "Dado conflitante — mais de uma origem diverge.", tom: "atencao" };
    case "corrigido":
      return {
        texto: "Dado corrigido — um valor anterior foi substituído por correção registrada.",
        tom: "informativo",
      };
    case "substituido":
      return { texto: "Dado substituído por uma leitura mais recente.", tom: "informativo" };
    default:
      return casoImpossivel(estado, "textoFrescor");
  }
}

export function textoAvaliacao(estado: EstadoAvaliacao): TextoComTom {
  switch (estado) {
    case "valida":
      return { texto: "Avaliação válida.", tom: "positivo" };
    case "parcial":
      return {
        texto: "Avaliação parcial — calculada com insumos incompletos, declarados abaixo.",
        tom: "atencao",
      };
    case "nao_avaliada":
      // P1 (ADR-0029/HAZ-0005): NUNCA redigir com vocabulário tranquilizador.
      return {
        texto:
          "Avaliação não computável — dados insuficientes para calcular com segurança (modo fail-closed).",
        tom: "inconclusivo",
      };
    case "desatualizada":
      return {
        texto: "Avaliação desatualizada — recalcule antes de decidir com base nela.",
        tom: "atencao",
      };
    case "invalida":
      return {
        texto: "Avaliação inválida — não deve ser usada para decisão clínica.",
        tom: "inconclusivo",
      };
    default:
      return casoImpossivel(estado, "textoAvaliacao");
  }
}

export function textoItemTrabalho(estado: EstadoItemTrabalho): TextoComTom {
  switch (estado) {
    case "nao_atribuido":
      return { texto: "Não atribuído.", tom: "neutro" };
    case "atribuido":
      return { texto: "Atribuído.", tom: "informativo" };
    case "reconhecido":
      // P5 (ADR-0029): "reconhecido" (ciência) é distinto de "resolvido" (encerramento).
      return { texto: "Ciência registrada (reconhecido).", tom: "positivo" };
    case "escalado":
      return { texto: "Escalado.", tom: "alerta" };
    case "sobreposto":
      return {
        texto: "Sobreposto manualmente — decisão registrada por um profissional.",
        tom: "atencao",
      };
    case "resolvido":
      return { texto: "Resolvido — encerrado.", tom: "positivo" };
    case "suprimido":
      // P6 (ADR-0029): supressão é sempre ato explícito e auditável, nunca ausência silenciosa.
      return {
        texto: "Suprimido — ocultação explícita e auditável, registrada por um profissional.",
        tom: "atencao",
      };
    case "reaberto":
      return { texto: "Reaberto.", tom: "alerta" };
    default:
      return casoImpossivel(estado, "textoItemTrabalho");
  }
}

export function textoConectividade(estado: EstadoConectividade): TextoComTom {
  switch (estado) {
    case "online":
      return { texto: "Conectado.", tom: "positivo" };
    case "degradado":
      return {
        texto:
          "Modo degradado — algumas funcionalidades limitadas; dados podem não estar atualizados.",
        tom: "atencao",
      };
    case "offline":
      return { texto: "Offline — sem conexão com o servidor.", tom: "alerta" };
    case "reconectando":
      return { texto: "Reconectando…", tom: "atencao" };
    case "reproduzindo":
      return { texto: "Sincronizando eventos perdidos…", tom: "informativo" };
    case "reconciliado":
      return { texto: "Sincronizado — dados reconciliados após reconexão.", tom: "informativo" };
    default:
      return casoImpossivel(estado, "textoConectividade");
  }
}

/** Rótulo textual (nunca só cor) para a banda de risco — nome + tom. */
export function textoBandaRisco(banda: BandaRisco): TextoComTom {
  switch (banda) {
    case "baixo":
      return { texto: "Risco baixo", tom: "positivo" };
    case "medio":
      return { texto: "Risco médio", tom: "atencao" };
    case "alto":
      return { texto: "Risco alto", tom: "alerta" };
    case "critico":
      return { texto: "Risco crítico", tom: "critico" };
    default:
      return casoImpossivel(banda, "textoBandaRisco");
  }
}

/**
 * Glifo curto não-dependente de cor, mostrado ao lado do texto de tom
 * (prompt §11 "non-color cues"). Deliberadamente distinto entre
 * `inconclusivo` (interrogação) e `neutro`/`positivo` — nunca o mesmo
 * símbolo de "ok" para um estado fail-closed (ADR-0029 P1).
 */
export function glifoTom(tom: Tom): string {
  switch (tom) {
    case "neutro":
      return "•";
    case "positivo":
      return "✓";
    case "informativo":
      return "i";
    case "atencao":
      return "!";
    case "alerta":
      return "▲";
    case "critico":
      return "▲▲";
    case "inconclusivo":
      return "?";
    default:
      return casoImpossivel(tom, "glifoTom");
  }
}
