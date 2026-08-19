/**
 * apps/web/src/components/AnuncioDeTela.tsx
 *
 * Anúncio da tela nova a tecnologia assistiva na transição de navegação
 * (LAC-L4). Complementa a gestão de foco (`roteamento/foco.ts`): o foco diz
 * ONDE se está, o anúncio diz O QUE mudou.
 *
 * POLIDA, E ISSO É REQUISITO DE SEGURANÇA, NÃO PREFERÊNCIA. `RegiaoAoVivoAlertas`
 * é `aria-live="assertive"` e existe para alerta clínico. Uma segunda região
 * assertiva disparando na mesma janela de tempo INTERROMPE a primeira: em vez
 * de melhorar a navegação, calaria o alerta. É a rajada que IA-P2 e HAZ-0037
 * proíbem, e a mesma decisão já tomada em `IndicadorConectividade` e
 * `AvisoProntidao` — o canal assertivo é reservado ao clinicamente urgente.
 *
 * A região existe no DOM desde a primeira pintura, com texto vazio. Uma live
 * region inserida JUNTO com o seu texto frequentemente não é anunciada: o leitor
 * de tela precisa já estar observando o nó. Mesma razão de `RegiaoAoVivoAlertas`
 * ser renderizada sempre.
 */

interface AnuncioDeTelaProps {
  /** `null` = nada a anunciar (primeira pintura, deep link, recarregamento). */
  mensagem: string | null;
}

export function AnuncioDeTela({ mensagem }: AnuncioDeTelaProps) {
  return (
    <div
      className="sr-only"
      data-testid="anuncio-de-tela"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {mensagem ?? ""}
    </div>
  );
}
