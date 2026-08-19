/**
 * apps/web/src/estado/visibilidade.ts
 *
 * VISIBILIDADE DA ABA — e por que uma tela clínica precisa saber disso.
 *
 * O navegador ESTRANGULA temporizadores em abas ocultas: no Chromium um
 * `setTimeout` de aba em segundo plano é limitado a no mínimo um minuto, e
 * depois de alguns minutos a aba pode ser congelada por completo. O mesmo
 * acontece quando o sistema entra em suspensão. Nada disso é evitável pelo
 * cliente — e é justamente aí que está o risco: a releitura automática ESPAÇA
 * sozinha, sem que nada na tela mude, e quem volta para a aba encontra um
 * retrato antigo com aparência de corrente. É HAZ-0025 chegando por uma porta
 * que LAC-L1 não fechou.
 *
 * O QUE ESTE MÓDULO FAZ, então, são duas coisas — e nenhuma delas é "consertar
 * o estrangulamento", que não é consertável:
 *
 *   1. tornar o fato OBSERVÁVEL, para que a tela possa declará-lo;
 *   2. marcar o RETORNO à visibilidade, para que a tela possa reler
 *      imediatamente em vez de esperar o próximo ciclo — que é também o
 *      caminho de recuperação após suspensão do sistema.
 *
 * O QUE ESTE MÓDULO NÃO FAZ: espaçar a releitura por conta própria quando a aba
 * fica oculta. O navegador já espaça, e somar um espaçamento nosso ao dele
 * aumentaria a idade do retrato sem nenhum ganho que compense — a economia de
 * carga já vem do estrangulamento nativo.
 *
 * Rastreio: HAZ-0025, SAF-0025, LAC-L1, ADR-0011 P8.
 */
import { useEffect, useState } from "react";

export type VisibilidadeAba = "visivel" | "oculta";

export interface VisibilidadeObservada {
  readonly estado: VisibilidadeAba;
  /**
   * Contador que AVANÇA a cada retorno de `oculta` para `visivel`. É um número
   * e não um booleano de borda porque o consumidor é um efeito: comparar com o
   * último valor visto torna a reação idempotente e imune a re-render.
   */
  readonly retornosAoVisivel: number;
}

/** Lê o estado corrente sem supor `document` (ambiente sem DOM devolve visível). */
function lerVisibilidade(): VisibilidadeAba {
  if (typeof document === "undefined") return "visivel";
  return document.visibilityState === "hidden" ? "oculta" : "visivel";
}

export function useVisibilidadeDaAba(): VisibilidadeObservada {
  const [estado, setEstado] = useState<VisibilidadeAba>(lerVisibilidade);
  const [retornosAoVisivel, setRetornos] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") return;

    function aoMudar(): void {
      const novo = lerVisibilidade();
      setEstado((anterior) => {
        // A borda oculta → visível é contada AQUI, dentro do atualizador, para
        // que ela dependa do estado anterior real e não de uma leitura que pode
        // ter envelhecido entre o evento e o render.
        if (anterior === "oculta" && novo === "visivel") {
          setRetornos((quantos) => quantos + 1);
        }
        return novo;
      });
    }

    document.addEventListener("visibilitychange", aoMudar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudar);
    };
  }, []);

  return { estado, retornosAoVisivel };
}
