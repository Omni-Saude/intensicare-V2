/**
 * apps/web/src/roteamento/rotas.ts
 *
 * Gramática de rotas desta fatia — PURA (sem React, sem `window`, sem I/O).
 *
 * POR QUE ESTE ARQUIVO EXISTE (LAC-L4). Até aqui a navegação era um
 * `useState<string|null>` em `App.tsx`: sem URL por leito, sem deep link, sem
 * histórico (o "voltar" do navegador SAÍA da aplicação), sem preservação de
 * contexto no recarregamento. Três critérios WCAG dependiam disso — 2.4.1
 * (Bypass Blocks), 2.4.2 (Page Titled) e, quando a sessão real chegar
 * (ADR-0015), 2.2.1 (Timing Adjustable).
 *
 * SEM DEPENDÊNCIA DE RUNTIME. Nenhuma biblioteca de rotas está instalada nesta
 * fatia, e acrescentar uma a uma superfície clínica é decisão de cadeia de
 * suprimentos (ADR-0022, THR-0053/THR-0054), não de quem escreve a tela. A
 * navegação usa a History API nativa, por trás de uma porta (`./historico.ts`).
 *
 * O QUE A URL PODE CARREGAR, E O QUE NÃO PODE (anti-padrão 12 do contrato
 * comum, §6.12). A URL carrega **leito** — uma LOCALIZAÇÃO da unidade. Nunca
 * identificador de sujeito, referência PSR (`amh:psr:v1:…`), tenant, bearer ou
 * chave de idempotência. Isto não é uma convenção de nomenclatura: o analisador
 * abaixo é uma LISTA DE PERMISSÃO (`FORMATO_SEGMENTO_LEITO`) e qualquer coisa
 * fora dela vira `desconhecida` — inclusive uma referência PSR colada na barra
 * de endereço, que contém `:` e é rejeitada por construção.
 *
 * LEITO NÃO É PACIENTE — e o inverso é um risco declarado. Ver a rubrica
 * EM ABERTO do handoff: um identificador de leito numa URL persistida
 * (histórico do navegador, log de proxy reverso, `Referer`) mais um carimbo de
 * tempo apontam para quem ocupava aquele leito naquele instante. O
 * `Referrer-Policy: no-referrer` do artefato de execução (`apps/web/Dockerfile`)
 * cobre uma parte disso; o resto é decisão de privacidade, não desta camada.
 *
 * Rastreio: LAC-L4, ADR-0021, ADR-0022, HAZ-0046, WCAG 2.2 SC 2.4.1/2.4.2.
 */

/** Tela endereçável por URL. `desconhecida` é estado explícito, nunca redirect. */
export type Rota =
  | { readonly tipo: "grade" }
  | { readonly tipo: "detalhe"; readonly leitoId: string }
  | { readonly tipo: "desconhecida"; readonly caminho: string };

/** Prefixo do recurso de leito na URL. */
export const SEGMENTO_LEITOS = "leitos";

/**
 * Forma aceita de um identificador de leito na URL — LISTA DE PERMISSÃO.
 *
 * Letras, dígitos, espaço, ponto, hífen e sublinhado; primeiro caractere
 * alfanumérico; no máximo 64 caracteres. Deliberadamente SEM `:`, `@`, `/` e
 * `%` (após decodificação):
 *   - `:` elimina referências PSR (`amh:psr:v1:SYNTH-P001`) e URNs;
 *   - `/` e `%` eliminam contrabando de separador por codificação;
 *   - `@` elimina e-mail;
 *   - o teto de 64 elimina bearer/JWT colados na barra de endereço.
 *
 * O ESPAÇO ESTÁ NA LISTA POR OBSERVAÇÃO, NÃO POR GOSTO. As duas fontes de dado
 * desta fatia discordam sobre a forma do identificador de leito, e o contrato
 * (`@intensicare/contratos`) declara apenas `leitoId: string`, sem padrão:
 *   - o dublê de desenvolvimento (`api/fixtures.ts`) usa `"Leito 01"`;
 *   - as fixtures que alimentam a API real usam `"<unidade>-LEITO-01"`.
 * Uma lista sem espaço tornaria TODO leito do caminho `?mock` inendereçável —
 * a tela de "endereço não reconhecido" em cima de cada clique. Espaço não
 * ajuda a contrabandear identificador de sujeito nem credencial; `:` e o teto
 * de comprimento é que fazem esse trabalho.
 *
 * Fail-closed: o que não casa não é "melhor esforço", é `desconhecida`.
 */
const FORMATO_SEGMENTO_LEITO = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/;

/** `true` se o texto é aceitável como identificador de leito NUMA URL. */
export function ehIdentificadorDeLeitoAceitavelNaUrl(valor: string): boolean {
  return FORMATO_SEGMENTO_LEITO.test(valor);
}

/**
 * Divide o caminho em segmentos não vazios, decodificando cada um. Uma
 * sequência percent-encoded inválida NÃO derruba a tela: devolve `null`, que o
 * chamador trata como rota desconhecida.
 */
function segmentosDe(caminho: string): readonly string[] | null {
  const semQuery = caminho.split("?")[0]?.split("#")[0] ?? "";
  const brutos = semQuery.split("/").filter((s) => s.length > 0);
  const decodificados: string[] = [];
  for (const bruto of brutos) {
    try {
      decodificados.push(decodeURIComponent(bruto));
    } catch {
      return null;
    }
  }
  return decodificados;
}

/**
 * Analisa um caminho de URL. Total: todo caminho produz uma rota, e o caso
 * não reconhecido é um VALOR (`desconhecida`), nunca um lançamento nem um
 * redirecionamento silencioso para a grade — redirecionar apagaria da barra de
 * endereço o que a pessoa digitou, e ela ficaria sem saber que errou.
 */
export function analisarCaminho(caminho: string): Rota {
  const segmentos = segmentosDe(caminho);
  if (segmentos === null) return { tipo: "desconhecida", caminho };
  if (segmentos.length === 0) return { tipo: "grade" };

  if (segmentos.length === 2 && segmentos[0] === SEGMENTO_LEITOS) {
    const leitoId = segmentos[1] ?? "";
    if (!ehIdentificadorDeLeitoAceitavelNaUrl(leitoId)) {
      return { tipo: "desconhecida", caminho };
    }
    return { tipo: "detalhe", leitoId };
  }

  return { tipo: "desconhecida", caminho };
}

/**
 * Caminho canônico de uma rota. `desconhecida` devolve o caminho tal como
 * veio — serializar de volta para `/` seria o redirecionamento silencioso que
 * `analisarCaminho` recusa a fazer.
 */
export function caminhoDaRota(rota: Rota): string {
  switch (rota.tipo) {
    case "grade":
      return "/";
    case "detalhe":
      return `/${SEGMENTO_LEITOS}/${encodeURIComponent(rota.leitoId)}`;
    case "desconhecida":
      return rota.caminho;
  }
}

/**
 * Caminho do detalhe de um leito.
 *
 * NÃO LANÇA, e não filtra por conta própria. O contrato declara `leitoId:
 * string` sem padrão (`@intensicare/contratos`), então um identificador fora do
 * formato endereçável é possível em tese. As três saídas concebíveis eram:
 * lançar (derruba a grade inteira num clique), navegar em silêncio para lugar
 * nenhum (o clique "não faz nada" e ninguém investiga) ou produzir um caminho
 * que o próprio analisador recusa. A terceira é a única que termina em ESTADO
 * EXPLÍCITO NA TELA: o percurso vira "Endereço não reconhecido", com a URL
 * visível na barra de endereço e ação de retorno à grade.
 *
 * A propriedade que sustenta isso é verificada por teste (ida e volta):
 * `analisarCaminho(caminhoDoLeito(id))` é `detalhe` se e somente se `id` é
 * endereçável — e `encodeURIComponent` garante que nenhum separador, `%` ou
 * `:` atravesse como estrutura de caminho.
 */
export function caminhoDoLeito(leitoId: string): string {
  return `/${SEGMENTO_LEITOS}/${encodeURIComponent(leitoId)}`;
}
