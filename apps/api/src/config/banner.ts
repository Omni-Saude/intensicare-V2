/**
 * Banner de perfil — o anúncio inequívoco de que o processo NÃO é produção.
 *
 * A exigência do despacho é que o banner seja "observável por teste, não um
 * `console.log` solto". Aqui isso é estrutural, não uma convenção:
 *
 * - `construirBanner` é PURA e devolve um VALOR (`BannerRuntime | null`). Esse
 *   valor vive em `config.banner`, o que o torna asseverável por teste e —
 *   igualmente importante — disponível para a resposta de prontidão, que
 *   segundo ADR-0020 §4 O4 deve representar "capacidade segura", não apenas
 *   processo vivo;
 * - `emitirBanner` recebe o escritor por PARÂMETRO. Não existe escritor
 *   embutido: nenhum módulo consegue emitir banner "sem querer", e nenhum
 *   teste consegue deixar de ver o que foi emitido.
 *
 * As limitações listadas são derivadas da configuração REAL resolvida, nunca
 * de um texto fixo por perfil — se alguém rodar `dev-synthetic` apontando para
 * um PostgreSQL de verdade, a linha sobre PGlite não aparece.
 */
import { CAPACIDADES, type Perfil } from "./perfis.js";
import type { ModoBanco, ModoIdentidade } from "./variaveis.js";

export interface EntradaBanner {
  readonly perfil: Perfil;
  readonly bancoModo: ModoBanco;
  readonly semearFixturesSinteticas: boolean;
  readonly identidadeModo: ModoIdentidade;
  readonly temBundleDeRegra: boolean;
}

export interface BannerRuntime {
  readonly perfil: Perfil;
  readonly titulo: string;
  readonly limitacoes: readonly string[];
}

const TITULO_SINTETICO = "MODO SINTÉTICO — NÃO É PRODUÇÃO";
const TITULO_INTEGRACAO = "AMBIENTE DE INTEGRAÇÃO — DADOS SINTÉTICOS, NÃO É PRODUÇÃO";

/** Largura mínima do bloco. Nenhuma cor, nenhum controle de terminal: o banner
 * precisa continuar legível num log agregado, que é onde ele será lido. */
const LARGURA_MINIMA = 72;

/**
 * Limitações REAIS do runtime tal como configurado. Nenhuma string aqui contém
 * URL, credencial, emissor ou caminho — o banner vai para log, e log é
 * exatamente onde material sensível não pode estar (anti-padrão 12).
 */
export function limitacoesDe(entrada: EntradaBanner): readonly string[] {
  const capacidades = CAPACIDADES[entrada.perfil];
  const limitacoes: string[] = [];

  if (entrada.bancoModo === "pglite-memoria") {
    limitacoes.push(
      "Banco PGlite em memória: todo o estado morre com o processo, e a conclusão " +
        "sobre RLS obtida aqui NÃO é transferível para PostgreSQL real " +
        "(ADR-0016 §4.1; anti-padrão 6).",
    );
  }
  if (entrada.semearFixturesSinteticas) {
    limitacoes.push(
      "Semeadura de fixtures sintéticas executada pelo próprio bootstrap " +
        "(prefixo SYNTH-, GDEC-0014).",
    );
  }
  if (entrada.identidadeModo === "token-sintetico") {
    limitacoes.push(
      "Identidade por token sintético: sem verificação criptográfica e sem emissão, " +
        "expiração ou revogação de sessão (ADR-0015 não redigida).",
    );
  }
  if (!entrada.temBundleDeRegra) {
    limitacoes.push(
      "Nenhum bundle de regra clínica assinado é carregado nem verificado (ADR-0007).",
    );
  }
  if (capacidades.classe === "integracao") {
    limitacoes.push(
      "Nenhuma semeadura automática no bootstrap: a carga de dados sintéticos é ato " +
        "explícito do harness de teste.",
    );
  }
  if (capacidades.classe !== "produtivo") {
    limitacoes.push(
      "Perfil não produtivo: nenhum dado real é admitido — a fatia é sintética e consultiva.",
    );
  }
  return Object.freeze(limitacoes);
}

/** `null` quando o perfil não tem nada a anunciar (perfis produtivos). */
export function construirBanner(entrada: EntradaBanner): BannerRuntime | null {
  const capacidades = CAPACIDADES[entrada.perfil];
  if (!capacidades.exigeBanner) return null;
  return Object.freeze({
    perfil: entrada.perfil,
    titulo: capacidades.classe === "integracao" ? TITULO_INTEGRACAO : TITULO_SINTETICO,
    limitacoes: limitacoesDe(entrada),
  });
}

/** Quebra um texto longo em linhas de até `largura` colunas, sem cortar palavra. */
function quebrar(texto: string, largura: number): readonly string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    if (atual.length === 0) {
      atual = palavra;
    } else if (atual.length + 1 + palavra.length <= largura) {
      atual = `${atual} ${palavra}`;
    } else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual.length > 0) linhas.push(atual);
  return linhas;
}

/** Bloco delimitado por `=`, pronto para uma saída de linha por vez. */
export function formatarBanner(banner: BannerRuntime): readonly string[] {
  const corpo: string[] = [banner.titulo, `perfil: ${banner.perfil}`];
  for (const limitacao of banner.limitacoes) {
    const partes = quebrar(limitacao, LARGURA_MINIMA - 4);
    partes.forEach((parte, indice) => {
      corpo.push(indice === 0 ? `  - ${parte}` : `    ${parte}`);
    });
  }
  const largura = Math.max(LARGURA_MINIMA, ...corpo.map((linha) => linha.length));
  const borda = "=".repeat(largura);
  return Object.freeze([borda, ...corpo, borda]);
}

/**
 * Emite o banner linha a linha através de `escrever`. O escritor é obrigatório
 * e não tem valor padrão — ver nota de topo do módulo.
 */
export function emitirBanner(banner: BannerRuntime, escrever: (linha: string) => void): void {
  for (const linha of formatarBanner(banner)) escrever(linha);
}
