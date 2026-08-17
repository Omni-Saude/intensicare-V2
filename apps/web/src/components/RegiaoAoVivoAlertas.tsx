interface RegiaoAoVivoAlertasProps {
  mensagem: string | null;
}

/**
 * Região `aria-live="assertive"` dedicada a anúncios de alertas novos
 * (requisito explícito da tarefa: "aria em vivo para alertas novos").
 * Visualmente oculta (`.sr-only`) — o alerta já é visível na grade via
 * `BadgeTom`; esta região existe só para que um usuário de leitor de
 * tela, longe do foco da grade no momento, também seja notificado.
 */
export function RegiaoAoVivoAlertas({ mensagem }: RegiaoAoVivoAlertasProps) {
  return (
    <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
      {mensagem ?? ""}
    </div>
  );
}
