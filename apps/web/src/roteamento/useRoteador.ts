/**
 * apps/web/src/roteamento/useRoteador.ts
 *
 * Estado de navegação da casca (LAC-L4). Substitui o `useState<string|null>` de
 * `App.tsx` por uma rota derivada da URL, com histórico do navegador de fato.
 *
 * O CONTADOR DE NAVEGAÇÕES não é um detalhe: ele é o que distingue "a tela
 * mudou porque alguém navegou" de "a tela renderizou de novo porque chegou dado
 * novo". Sem essa distinção, a gestão de foco (`./foco.ts`) roubaria o foco a
 * cada ciclo de recarga automática — uma tela clínica que arranca o cursor da
 * pessoa de 30 em 30 segundos é pior do que uma sem gestão de foco nenhuma.
 * Ele começa em ZERO: a primeira pintura (deep link, recarregamento) NÃO é uma
 * navegação e não move o foco.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { HISTORICO_DO_NAVEGADOR, type PortaHistorico } from "./historico.js";
import { analisarCaminho, caminhoDoLeito, type Rota } from "./rotas.js";

export interface Roteador {
  /** Rota derivada do caminho corrente. Sempre definida (`desconhecida` inclusa). */
  readonly rota: Rota;
  /** Caminho corrente, tal como está na barra de endereço. */
  readonly caminho: string;
  /** Navegações desde a montagem. `0` na primeira pintura — ver nota acima. */
  readonly navegacoes: number;
  /** Empilha o detalhe de um leito. */
  irParaLeito: (leitoId: string) => void;
  /** Empilha a grade. */
  irParaGrade: () => void;
}

export function useRoteador(historico: PortaHistorico = HISTORICO_DO_NAVEGADOR): Roteador {
  const [caminho, setCaminho] = useState<string>(() => historico.caminhoAtual());
  const [navegacoes, setNavegacoes] = useState(0);

  // Voltar/avançar do NAVEGADOR: a fonte da verdade é sempre a porta, nunca o
  // estado local — um `popstate` pode vir de um salto de várias entradas.
  useEffect(() => {
    return historico.assinar(() => {
      setCaminho(historico.caminhoAtual());
      setNavegacoes((anterior) => anterior + 1);
    });
  }, [historico]);

  const irPara = useCallback(
    (destino: string) => {
      // Reempilhar o mesmo caminho criaria uma entrada de histórico que não
      // muda nada — e o "voltar" seguinte pareceria não funcionar.
      if (destino === historico.caminhoAtual()) return;
      historico.navegar(destino);
      setCaminho(destino);
      setNavegacoes((anterior) => anterior + 1);
    },
    [historico],
  );

  const irParaLeito = useCallback(
    (leitoId: string) => {
      irPara(caminhoDoLeito(leitoId));
    },
    [irPara],
  );

  const irParaGrade = useCallback(() => {
    irPara("/");
  }, [irPara]);

  const rota = useMemo(() => analisarCaminho(caminho), [caminho]);

  return { rota, caminho, navegacoes, irParaLeito, irParaGrade };
}
