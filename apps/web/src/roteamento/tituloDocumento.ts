/**
 * apps/web/src/roteamento/tituloDocumento.ts
 *
 * WCAG 2.2 SC 2.4.2 (Page Titled), nível A — o `<title>` era ESTÁTICO em todas
 * as telas (`index.html`: "IntensiCare V2"), o que em aplicação de página única
 * é o mesmo defeito que um site cujas páginas têm todas o mesmo título: quem
 * navega por lista de janelas, por histórico ou por leitor de tela não
 * distingue uma tela da outra.
 *
 * O QUE ESTE MÓDULO NÃO FAZ. Não redige texto clínico, não nomeia estado
 * clínico e não afirma nada sobre o paciente. O título nomeia a TELA e repete
 * a divulgação de contexto (consultivo/sintético) — que continua sendo obrigação
 * do `BannerContexto` na superfície visível (HAZ-0046, ADR-0004 §6.2); o título
 * a acompanha, nunca a substitui.
 *
 * VALIDATION REQUIRED (ADR-0029, condição C2 ABERTA): redação provisória de
 * engenharia, não terminologia ratificada.
 */
import { useEffect } from "react";
import type { Rota } from "./rotas.js";

/**
 * Tela corrente da casca. É MAIS do que a rota: sessão expirada e galeria de
 * revisão não são endereçáveis por URL, mas são telas distintas para quem lê o
 * título.
 */
export type TelaCorrente = Rota["tipo"] | "sessao_expirada" | "galeria";

/** Sufixo comum — o produto e a divulgação de contexto, em toda tela. */
export const SUFIXO_TITULO = "IntensiCare V2 (consultivo, dados sintéticos)";

/**
 * Título da tela. Puro e total: todo par (tela, rota) produz um título
 * distinto e não vazio.
 */
export function tituloDaTela(tela: TelaCorrente, rota: Rota): string {
  switch (tela) {
    case "grade":
      return `Grade de leitos — ${SUFIXO_TITULO}`;
    case "detalhe":
      return `Leito ${rota.tipo === "detalhe" ? rota.leitoId : ""} — Detalhe do leito — ${SUFIXO_TITULO}`;
    case "desconhecida":
      return `Endereço não reconhecido — ${SUFIXO_TITULO}`;
    case "sessao_expirada":
      return `Sessão expirada — ${SUFIXO_TITULO}`;
    case "galeria":
      return `Revisão de UI — estados de tela — ${SUFIXO_TITULO}`;
  }
}

/**
 * Nome CURTO da tela, para o anúncio de transição. Separado do título porque
 * repetir o sufixo inteiro numa live region a cada navegação seria ruído no
 * canal que o alerta clínico precisa (IA-P2, HAZ-0037).
 */
export function nomeDaTela(tela: TelaCorrente, rota: Rota): string {
  switch (tela) {
    case "grade":
      return "Grade de leitos";
    case "detalhe":
      return `Detalhe do leito ${rota.tipo === "detalhe" ? rota.leitoId : ""}`.trim();
    case "desconhecida":
      return "Endereço não reconhecido";
    case "sessao_expirada":
      return "Sessão expirada";
    case "galeria":
      return "Revisão de UI — estados de tela";
  }
}

/**
 * Aplica o título ao documento. Efeito isolado num hook próprio para que a
 * derivação (acima) continue pura e testável sem DOM.
 */
export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = titulo;
  }, [titulo]);
}
