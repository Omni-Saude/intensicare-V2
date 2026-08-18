/**
 * apps/web/src/a11y/matrizAcessibilidade.ts
 *
 * MATRIZ EXPLÍCITA de critérios WCAG 2.2 AA desta fatia, com a separação que
 * o despacho ACH-07 exige: o que a automação cobre × o que só um usuário de
 * tecnologia assistiva pode responder.
 *
 * POR QUE É CÓDIGO E NÃO PROSA. Uma matriz em documento envelhece em silêncio.
 * Como módulo tipado, ela é verificada por teste (`./matrizAcessibilidade.test.ts`):
 * nenhum critério pode ficar sem cobertura declarada, nenhum critério
 * `manual` pode ser marcado como executado por automação, e acrescentar um
 * critério sem decidir sua cobertura quebra a compilação.
 *
 * DECLARAÇÃO VINCULANTE (ADR-0021 F7; contrato comum §2): NADA aqui declara
 * acessibilidade validada. Automação encontra uma fração conhecida das
 * barreiras reais; a validação com leitor de tela, ampliação e navegação por
 * teclado feita por PESSOAS que dependem dessas tecnologias é dependência
 * humana e está `BLOQUEADO`/`NÃO EXECUTADO` até ocorrer (SPR-G4-5, MG-G4).
 *
 * Rastreio: ADR-0021 F7, HAZ-0037, SAF-0034, WCAG 2.2 AA, ACH-07.
 */

/** Como a verificação do critério é feita nesta fatia. */
export type CoberturaCriterio =
  /** Verificado por axe-core em jsdom (suíte de componentes). */
  | "automatizado_jsdom"
  /** Verificado por axe-core em navegador real (suíte Playwright). */
  | "automatizado_navegador"
  /** Verificado por teste de comportamento próprio (teclado, foco, live region). */
  | "automatizado_comportamento"
  /** Exige pessoa usuária de tecnologia assistiva. Automação NÃO substitui. */
  | "manual_obrigatorio";

/** Estado de execução — honesto, incluindo "não executado". */
export type ExecucaoCriterio = "executado" | "nao_executado" | "bloqueado";

export interface CriterioAcessibilidade {
  /** Número do critério de sucesso WCAG 2.2 (ex.: "1.4.3"). */
  readonly sc: string;
  readonly nome: string;
  readonly cobertura: readonly CoberturaCriterio[];
  readonly execucao: ExecucaoCriterio;
  /** Por que esta cobertura, e o que ela NÃO prova. */
  readonly nota: string;
}

/**
 * Quantos critérios A+AA existem na WCAG 2.2, no total. Declarado aqui para
 * que a razão entre o enumerado e o universo fique visível e verificada por
 * teste, em vez de subentendida.
 */
export const TOTAL_CRITERIOS_WCAG_22_AA = 56;

/**
 * A matriz. Os critérios foram escolhidos a partir das obrigações já escritas
 * em `docs/10-ux-and-accessibility/arquitetura-de-informacao.md` §2.2 e
 * `requisito-registro-limitado-instituicao.md` RLI-3, MAIS os critérios de
 * contraste (1.4.3/1.4.11) — que estavam ausentes da matriz daquele
 * documento, uma lacuna que esta fatia registra em vez de herdar em silêncio.
 *
 * RECORTE, DITO ÀS CLARAS. Esta lista enumera 15 critérios; a WCAG 2.2 nível
 * A+AA tem 56. "WCAG 2.2 AA" aqui é, portanto, um SUBCONJUNTO deliberado —
 * os critérios com obrigação já escrita nos artefatos do §11 — e não uma
 * varredura do padrão inteiro. Ao menos três dos 41 não enumerados têm lacuna
 * conhecida hoje, todas consequência da ausência de roteamento por URL:
 *
 *   - 2.4.1 (Bypass Blocks): não há link de pular para o conteúdo;
 *   - 2.4.2 (Page Titled): o `<title>` é estático em todas as telas;
 *   - 2.2.1 (Timing Adjustable): pertinente quando a sessão real chegar
 *     (ADR-0015), porque expiração sem ajuste é barreira de acessibilidade.
 *
 * Elas ficam registradas aqui, e não corrigidas, porque a correção pertence a
 * um pacote de navegação que esta fatia não tem — e porque um recorte não
 * declarado leria como conformidade que ninguém verificou.
 */
export const MATRIZ_ACESSIBILIDADE: readonly CriterioAcessibilidade[] = [
  {
    sc: "1.3.1",
    nome: "Informação e relações (estrutura programática)",
    cobertura: ["automatizado_jsdom", "automatizado_navegador"],
    execucao: "executado",
    nota:
      "axe verifica papéis, nomes acessíveis e associação de rótulos. NÃO verifica se a " +
      "estrutura faz sentido clínico na ordem em que é lida.",
  },
  {
    sc: "1.4.1",
    nome: "Uso de cor (sinal não dependente só de cor)",
    cobertura: ["automatizado_comportamento"],
    execucao: "executado",
    nota:
      "Cada estado carrega texto + glifo (`glifoTom`), verificado por teste de linguagem. " +
      "axe NÃO detecta dependência de cor — isso exige inspeção do desenho.",
  },
  {
    sc: "1.4.3",
    nome: "Contraste mínimo (texto 4.5:1)",
    cobertura: ["automatizado_navegador"],
    execucao: "executado",
    nota:
      "jsdom não computa estilo cascateado, então `color-contrast` é DESLIGADA na suíte " +
      "de componentes. EXECUTADO em navegador real (`e2e/acessibilidade.spec.ts`), " +
      "incluindo a galeria do §11 — a página onde todos os tons semânticos aparecem " +
      "lado a lado, que é a varredura de contraste mais densa da fatia.",
  },
  {
    sc: "1.4.10",
    nome: "Reflow (zoom 400% sem rolagem em dois eixos)",
    cobertura: ["automatizado_navegador"],
    execucao: "executado",
    nota:
      "EXECUTADO a 320 CSS px (`e2e/reflow.spec.ts`). Este critério ENCONTROU UM DEFEITO " +
      "REAL: `white-space: nowrap` nos selos de estado produzia 1062px de conteúdo numa " +
      "janela de 320px. Corrigido em `estilo.css` sem encurtar nenhum texto clínico. " +
      "Se há PERDA DE ESTADO DE SEGURANÇA sob reflow segue sendo juízo humano.",
  },
  {
    sc: "1.4.11",
    nome: "Contraste de componentes não textuais",
    cobertura: ["automatizado_navegador"],
    execucao: "executado",
    nota:
      "Coberto pelas regras `wcag21aa` do axe em navegador real. ATENÇÃO: a cobertura do " +
      "axe para 1.4.11 é PARCIAL — bordas, estados de foco e ícones personalizados não " +
      "são integralmente avaliáveis por ferramenta. Verde aqui não é conformidade.",
  },
  {
    sc: "2.1.1",
    nome: "Teclado (toda funcionalidade operável)",
    cobertura: ["automatizado_comportamento", "manual_obrigatorio"],
    execucao: "executado",
    nota:
      "Automação percorre a ordem de tabulação e ativa controles por teclado. NÃO prova " +
      "que a operação é praticável sob pressão de tempo com leitor de tela ativo.",
  },
  {
    sc: "2.1.2",
    nome: "Sem armadilha de foco",
    cobertura: ["automatizado_comportamento"],
    execucao: "executado",
    nota: "Verificado percorrendo a ordem de tabulação em ciclo fechado.",
  },
  {
    sc: "2.4.3",
    nome: "Ordem de foco (banner → estado → conteúdo → ações)",
    cobertura: ["automatizado_comportamento", "manual_obrigatorio"],
    execucao: "executado",
    nota:
      "A ordem do DOM é verificada. Se ESSA ordem é a ordem de leitura clínica correta é " +
      "juízo de quem usa — não é decidível por automação.",
  },
  {
    sc: "2.4.7",
    nome: "Foco visível",
    cobertura: ["automatizado_navegador", "manual_obrigatorio"],
    execucao: "executado",
    nota:
      "EXECUTADO: a suíte percorre a ordem de tabulação em navegador real e afirma, para " +
      "CADA elemento focado, que existe `outline` com largura > 0 ou `box-shadow`. O que " +
      "isso NÃO prova: que o indicador seja PERCEPTÍVEL para uma pessoa com baixa visão — " +
      "contraste e espessura do indicador contra o fundo real seguem exigindo validação " +
      "humana.",
  },
  {
    sc: "2.4.11",
    nome: "Foco não obscurecido (mínimo)",
    cobertura: ["automatizado_navegador", "manual_obrigatorio"],
    execucao: "nao_executado",
    nota:
      "NÃO EXECUTADO. O banner de contexto é permanente por obrigação de segurança " +
      "clínica (HAZ-0046); se ele chega a obscurecer o elemento focado sob rolagem não " +
      "foi verificado. Exige teste dedicado de rolagem com foco, ainda não escrito.",
  },
  {
    sc: "2.3.3",
    nome: "Animação a partir de interação (prefers-reduced-motion)",
    cobertura: ["automatizado_comportamento", "automatizado_navegador"],
    execucao: "executado",
    nota:
      "AAA como alvo, AA como piso (arquitetura-de-informacao §2.2). EXECUTADO em " +
      "navegador com a preferência REALMENTE emulada — e o meta-teste que prova a " +
      "emulação existe porque, sem ele, o verde seria vazio (esta fatia não tem " +
      "animação alguma, então o teste passaria mesmo sem a preferência aplicada).",
  },
  {
    sc: "2.5.8",
    nome: "Tamanho do alvo (mínimo 24×24 CSS px)",
    cobertura: ["automatizado_navegador"],
    execucao: "executado",
    nota:
      "EXECUTADO: a suíte mede a caixa real de cada botão visível em navegador. Não " +
      "cobre alvos que só existem em telas ainda não escritas.",
  },
  {
    sc: "3.3.1",
    nome: "Identificação de erro",
    cobertura: ["automatizado_comportamento", "automatizado_jsdom"],
    execucao: "executado",
    nota:
      "Todo estado de falha é anunciado (`role=alert`) e oferece ação de recuperação — " +
      "verificado em `components/resiliencia.test.tsx`.",
  },
  {
    sc: "4.1.2",
    nome: "Nome, função, valor",
    cobertura: ["automatizado_jsdom", "automatizado_navegador"],
    execucao: "executado",
    nota: "axe verifica nomes acessíveis de botões, grupos e regiões.",
  },
  {
    sc: "4.1.3",
    nome: "Mensagens de estado (live regions)",
    cobertura: ["automatizado_comportamento", "manual_obrigatorio"],
    execucao: "executado",
    nota:
      "A presença e a polidez das live regions são verificadas. SE o anúncio é de fato " +
      "ouvido, na ordem certa e sem competir com outra região assertiva, é EXATAMENTE o " +
      "que só um usuário de leitor de tela pode responder (HAZ-0037/SAF-0034). Esta fatia " +
      "mantém até três regiões vivas simultâneas (alertas clínicos, conectividade, estado " +
      "da lista) — a coexistência é decisão de desenho e está na fila de validação manual.",
  },
];

/** Critérios que a automação NÃO pode encerrar sozinha. */
export function criteriosQueExigemValidacaoManual(): readonly CriterioAcessibilidade[] {
  return MATRIZ_ACESSIBILIDADE.filter((c) => c.cobertura.includes("manual_obrigatorio"));
}

/** Critérios ainda não executados nesta fatia (honestidade de estado). */
export function criteriosNaoExecutados(): readonly CriterioAcessibilidade[] {
  return MATRIZ_ACESSIBILIDADE.filter((c) => c.execucao !== "executado");
}

/**
 * Declaração de estado da acessibilidade desta fatia. É deliberadamente uma
 * função (e não uma string solta) para que qualquer superfície que queira
 * afirmar algo sobre acessibilidade tenha de passar por aqui.
 */
export function declaracaoDeAcessibilidade(): string {
  return (
    "NÃO VALIDADA. Automação WCAG 2.2 AA executada parcialmente; validação com " +
    "usuários de tecnologia assistiva é dependência humana e permanece NÃO EXECUTADA " +
    `(${criteriosQueExigemValidacaoManual().length} critérios exigem validação manual; ` +
    `${criteriosNaoExecutados().length} ainda não executados). ` +
    // Sem esta frase, a declaração leria como se a matriz cobrisse o padrão.
    `A matriz enumera ${MATRIZ_ACESSIBILIDADE.length} dos ${TOTAL_CRITERIOS_WCAG_22_AA} ` +
    "critérios A+AA da WCAG 2.2 — é um recorte declarado, não uma varredura do padrão."
  );
}
