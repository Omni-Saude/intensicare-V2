/**
 * apps/web/src/a11y/cor.ts — aritmética de cor da WCAG 2.x, em um lugar só.
 *
 * POR QUE EM CÓDIGO E NÃO EM COMENTÁRIO. O cabeçalho de `src/estilo.css`
 * declarava os contrastes dos selos como "CONFERIDOS À MÃO, não verificados
 * por ferramenta". Valor conferido à mão envelhece em silêncio: quem trocar um
 * hex não recalcula nada, e o comentário continua afirmando o número antigo.
 * Aqui a razão é DERIVADA — da cor que o navegador computou, na suíte de
 * navegador, e do hex declarado na folha, na suíte de componentes.
 *
 * POR QUE EM `src/a11y/` E NÃO EM `e2e/apoio/`. Duas suítes precisam da mesma
 * fórmula: a de navegador (`e2e/contraste-tema-escuro.spec.ts`) e a de
 * componentes (`./acessibilidade.test.tsx`, que lê a folha por `?raw`).
 * Duplicar a aritmética normativa em dois arquivos é convidar as duas cópias a
 * divergirem, e a que divergisse produziria um contraste que ninguém escreveu.
 * Este módulo NÃO é importado por nenhum caminho de produção — só por testes.
 *
 * Fórmulas transcritas da WCAG 2.2 (definições "relative luminance" e
 * "contrast ratio", W3C REC 05-out-2023). Não há decisão de produto neste
 * arquivo — só a norma, escrita em código para poder ser executada.
 */

/** Componente sRGB linearizado, conforme a definição de luminância relativa. */
function linearizar(canalDe0A255: number): number {
  const s = canalDe0A255 / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Cor sRGB com canal alfa, como o navegador a devolve em `getComputedStyle`. */
export interface CorRgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

/**
 * Converte `#rrggbb` (como está escrito na folha) ou `rgb(...)`/`rgba(...)`
 * (como o navegador devolve em `getComputedStyle`) em canais.
 *
 * Lança em vez de devolver um preto silencioso: uma cor que não pôde ser lida
 * viraria contraste inventado, e contraste inventado é pior que teste ausente.
 */
export function lerCor(valor: string): CorRgb {
  const texto = valor.trim();

  const hex = /^#([0-9a-f]{6})$/i.exec(texto);
  if (hex !== null) {
    const d = hex[1] as string;
    return {
      r: Number.parseInt(d.slice(0, 2), 16),
      g: Number.parseInt(d.slice(2, 4), 16),
      b: Number.parseInt(d.slice(4, 6), 16),
      a: 1,
    };
  }

  const numeros = texto.match(/[\d.]+/g);
  if (numeros === null || numeros.length < 3 || !texto.toLowerCase().startsWith("rgb")) {
    throw new Error(`cor não reconhecida: ${JSON.stringify(valor)}`);
  }
  const [r, g, b, a] = numeros.map(Number) as [number, number, number, number?];
  return { r, g, b, a: a ?? 1 };
}

/** Luminância relativa (WCAG 2.2, definição normativa). */
export function luminanciaRelativa(cor: CorRgb): number {
  return 0.2126 * linearizar(cor.r) + 0.7152 * linearizar(cor.g) + 0.0722 * linearizar(cor.b);
}

/** Razão de contraste (WCAG 2.2, definição normativa). Vai de 1 a 21. */
export function razaoDeContraste(a: CorRgb, b: CorRgb): number {
  const la = luminanciaRelativa(a);
  const lb = luminanciaRelativa(b);
  const [claro, escuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (escuro + 0.05);
}

/** Distância euclidiana em sRGB — usada só para detectar COLAPSO entre tons. */
export function distanciaSrgb(a: CorRgb, b: CorRgb): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

/** Formata com duas casas, para mensagem de falha legível. */
export function fmt(n: number): string {
  return n.toFixed(2);
}
