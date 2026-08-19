/**
 * apps/web/src/components/LinkPular.tsx
 *
 * WCAG 2.2 SC 2.4.1 (Bypass Blocks), nível A — lacuna registrada em
 * `a11y/matrizAcessibilidade.ts` e em LAC-L4: não havia link de pular para o
 * conteúdo. Toda tela desta fatia começa por um bloco repetido (banner
 * permanente de contexto, HAZ-0046, que NUNCA pode ser removido) seguido de
 * avisos de conectividade, prontidão e frescor. Sem o atalho, quem navega por
 * teclado ou leitor de tela atravessa o mesmo bloco em cada tela, toda vez.
 *
 * POR QUE `preventDefault` NUM LINK DE ÂNCORA. O comportamento nativo de
 * `href="#id"` empurra uma entrada no histórico com o fragmento. Como esta
 * fatia passou a ter histórico de verdade (LAC-L4: "voltar volta para a grade,
 * não sai da aplicação"), usar o atalho antes de navegar faria o primeiro
 * "voltar" apenas remover o `#` — o botão pareceria quebrado. O foco é movido
 * programaticamente e o `href` permanece, porque é ele que dá ao elemento papel
 * de link, alvo declarado e ativação por Enter sem nenhum JavaScript de teclado.
 *
 * O link é o PRIMEIRO nó focável do documento (por ordem de DOM em `App.tsx`) e
 * fica visível ao receber foco (`.link-pular:focus` em `estilo.css`) — um
 * atalho invisível quando focado seria uma armadilha, não um atalho.
 *
 * VALIDATION REQUIRED (ADR-0029 C2 ABERTA): redação provisória; nenhum texto
 * aqui é clínico.
 */

/** Identificador do contêiner de conteúdo principal — alvo do atalho. */
export const ID_CONTEUDO_PRINCIPAL = "conteudo-principal";

interface LinkPularProps {
  /** Move o foco para o conteúdo principal. */
  aoPular: () => void;
}

export function LinkPular({ aoPular }: LinkPularProps) {
  return (
    <a
      className="link-pular"
      data-testid="link-pular"
      href={`#${ID_CONTEUDO_PRINCIPAL}`}
      onClick={(evento) => {
        evento.preventDefault();
        aoPular();
      }}
    >
      Pular para o conteúdo principal
    </a>
  );
}
