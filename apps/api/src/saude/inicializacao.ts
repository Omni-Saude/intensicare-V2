/**
 * apps/api/src/saude/inicializacao.ts — a terceira superfície: STARTUP.
 *
 * Por que startup é uma superfície separada de readiness
 * ------------------------------------------------------
 * As duas respondem "ainda não" com o mesmo código HTTP, mas significam
 * coisas operacionalmente opostas. `startup` diz "este processo ainda não
 * terminou de subir — espere, não me reinicie"; `readiness` diz "este
 * processo subiu e mesmo assim não tem capacidade segura — não me mande
 * tráfego". Colapsar as duas produz o modo de falha clássico: o supervisor
 * mata em laço um processo que só precisava de mais tempo para migrar o
 * banco, ou deixa entrar tráfego em um processo que subiu sem regra clínica.
 * O anti-padrão §10.10 ("mesmo endpoint/status para liveness, readiness e
 * startup") é exatamente essa confusão.
 *
 * Sem relógio interno e sem timer
 * --------------------------------
 * O registro não tem `setTimeout` nem lê o relógio por conta própria: o
 * tempo entra pela `Telemetry` injetada (mesma disciplina de
 * `packages/observabilidade/src/telemetry.ts` e do kernel clínico). Um
 * "tempo limite de inicialização" seria um alvo numérico — matéria do Gate
 * G1, não deste arquivo.
 *
 * Nenhuma alegação de efetividade clínica é feita por este módulo.
 */
import { type FailureCategory, recordFailure, type Telemetry } from "@intensicare/observabilidade";

export const ESTADOS_INICIALIZACAO = ["iniciando", "concluida", "falhou"] as const;

export type EstadoInicializacao = (typeof ESTADOS_INICIALIZACAO)[number];

export interface RegistroDeInicializacao {
  readonly estado: () => EstadoInicializacao;
  /** Etapas declaradas e ainda não concluídas, na ordem de declaração. */
  readonly etapasPendentes: () => readonly string[];
  /** Marca uma etapa como concluída. Etapa desconhecida é ignorada. */
  readonly concluirEtapa: (nome: string) => void;
  /**
   * Declara a inicialização como FALHA. Estado terminal: uma inicialização
   * que falhou não volta a "iniciando" por conta própria — quem reinicia é o
   * supervisor, e o processo precisa continuar respondendo falha até lá.
   */
  readonly falhar: (categoria: FailureCategory) => void;
  readonly iniciadoEmMs: number;
}

export interface OpcoesDeInicializacao {
  readonly telemetry: Telemetry;
  /**
   * Etapas que precisam concluir antes de o processo ser considerado
   * iniciado. Lista VAZIA significa "nada a esperar" — e o estado nasce
   * `concluida`. Isso é deliberado e honesto: uma lista vazia não é uma
   * inicialização verificada, é a declaração de que nada foi declarado.
   */
  readonly etapas: readonly string[];
}

export function criarRegistroDeInicializacao(
  opcoes: OpcoesDeInicializacao,
): RegistroDeInicializacao {
  const pendentes = [...opcoes.etapas];
  const iniciadoEmMs = opcoes.telemetry.clock();
  let falhou = false;

  return {
    iniciadoEmMs,

    estado(): EstadoInicializacao {
      if (falhou) return "falhou";
      return pendentes.length === 0 ? "concluida" : "iniciando";
    },

    etapasPendentes(): readonly string[] {
      return [...pendentes];
    },

    concluirEtapa(nome: string): void {
      const indice = pendentes.indexOf(nome);
      if (indice >= 0) pendentes.splice(indice, 1);
    },

    falhar(categoria: FailureCategory): void {
      falhou = true;
      // A falha de inicialização é publicada como sinal OPERACIONAL
      // categorizado (ADR-0020 O8: jamais chamada de "alerta"). Sem esta
      // linha, um processo que nunca sobe seria indistinguível, na série de
      // métricas, de um processo que ninguém iniciou.
      recordFailure(opcoes.telemetry, categoria);
    },
  };
}
