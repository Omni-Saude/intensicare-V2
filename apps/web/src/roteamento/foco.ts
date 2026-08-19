/**
 * apps/web/src/roteamento/foco.ts
 *
 * GESTÃO DE FOCO NA TRANSIÇÃO DE TELA (LAC-L4).
 *
 * Numa aplicação de página única, trocar de tela sem mexer no foco deixa o
 * cursor de teclado na âncora da tela ANTERIOR — que acabou de sair do DOM. O
 * navegador então joga o foco no `<body>`, e a próxima tabulação recomeça do
 * topo do documento, sem que nada tenha sido anunciado: para quem usa leitor de
 * tela, a tela simplesmente não mudou.
 *
 * AS DUAS COISAS QUE ESTE HOOK NÃO FAZ, e são a razão de ele ser um hook e não
 * três linhas soltas:
 *
 *   1. NÃO move o foco na primeira pintura. Deep link e recarregamento não são
 *      navegação: mover o foco ali arrancaria o cursor de quem recarregou a
 *      página no meio de outra coisa e, pior, puliaria o skip-link — que só
 *      serve por ser o PRIMEIRO ponto de tabulação (SC 2.4.1).
 *   2. NÃO move o foco quando a tela apenas re-renderiza. A dependência é o
 *      CONTADOR DE NAVEGAÇÕES (`useRoteador`), não o conteúdo: uma recarga
 *      automática de 30 em 30 segundos não pode roubar o foco de quem está
 *      operando um controle.
 *
 * `preventScroll` é deliberado: o foco vai para o início do conteúdo, mas a
 * rolagem não é reposicionada à força — mover a viewport por baixo de quem usa
 * ampliação de tela é desorientação, não ajuda.
 */
import { type RefObject, useEffect, useRef } from "react";

/**
 * Devolve a ref que deve ser aplicada ao contêiner de conteúdo da tela (um
 * elemento com `tabIndex={-1}`, tipicamente o `<main>`). O foco é movido para
 * ele a cada NAVEGAÇÃO — nunca na primeira pintura, nunca num re-render.
 */
export function useFocoNaTransicaoDeTela<T extends HTMLElement>(navegacoes: number): RefObject<T> {
  const alvo = useRef<T>(null);

  useEffect(() => {
    if (navegacoes === 0) return;
    alvo.current?.focus({ preventScroll: true });
  }, [navegacoes]);

  return alvo;
}
