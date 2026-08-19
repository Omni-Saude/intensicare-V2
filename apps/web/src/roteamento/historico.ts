/**
 * apps/web/src/roteamento/historico.ts
 *
 * PORTA DE HISTÓRICO — a History API do navegador atrás de uma interface
 * injetável, no mesmo regime de `estado/relogio.ts`: o comportamento que
 * depende do navegador vira uma dependência do componente, e o teste controla
 * a dependência em vez de tentar controlar o navegador.
 *
 * Sem biblioteca de rotas (LAC-L4, requisito explícito): `pushState`,
 * `popstate` e `history.back()` bastam para as duas telas desta fatia.
 *
 * A QUERY STRING É PRESERVADA em toda navegação, e isso é deliberado: em
 * desenvolvimento a URL carrega `?mock` e `?estados`, que decidem o cliente e a
 * galeria no bootstrap (`api/resolverCliente.ts`, `perfil.ts`). Descartá-la ao
 * navegar faria a aba mudar de identidade no primeiro recarregamento — a
 * pessoa clicaria num leito e, ao recarregar, cairia num app diferente do que
 * estava usando.
 */

/** Porta mínima de histórico consumida por `./useRoteador.ts`. */
export interface PortaHistorico {
  /** Caminho corrente (sem query string nem fragmento). */
  caminhoAtual(): string;
  /** Empilha uma nova entrada de histórico. */
  navegar(caminho: string): void;
  /** Substitui a entrada corrente (não cria ponto de "voltar"). */
  substituir(caminho: string): void;
  /** Assina mudanças originadas no NAVEGADOR (voltar/avançar). */
  assinar(ouvinte: () => void): () => void;
  /** Volta uma entrada — existe para teste e para a tela de rota desconhecida. */
  voltar(): void;
}

/**
 * Implementação sobre `globalThis.location`/`globalThis.history`.
 *
 * Tolerante à AUSÊNCIA das duas APIs (renderização em servidor de teste,
 * `renderToStaticMarkup`): sem `location` o caminho corrente é `/` e navegar é
 * inócuo. Isto não é degradação silenciosa de segurança — é a ausência de um
 * navegador, e a alternativa (lançar) quebraria `render.test.tsx`, que renderiza
 * a casca fora do DOM de propósito.
 */
export const HISTORICO_DO_NAVEGADOR: PortaHistorico = {
  caminhoAtual(): string {
    return globalThis.location?.pathname ?? "/";
  },

  navegar(caminho: string): void {
    const historico = globalThis.history as History | undefined;
    if (historico === undefined) return;
    historico.pushState(null, "", caminho + (globalThis.location?.search ?? ""));
  },

  substituir(caminho: string): void {
    const historico = globalThis.history as History | undefined;
    if (historico === undefined) return;
    historico.replaceState(null, "", caminho + (globalThis.location?.search ?? ""));
  },

  assinar(ouvinte: () => void): () => void {
    const alvo = globalThis as unknown as {
      addEventListener?: (t: string, o: () => void) => void;
      removeEventListener?: (t: string, o: () => void) => void;
    };
    alvo.addEventListener?.("popstate", ouvinte);
    return () => {
      alvo.removeEventListener?.("popstate", ouvinte);
    };
  },

  voltar(): void {
    (globalThis.history as History | undefined)?.back();
  },
};
