/**
 * Banner permanente de contexto — sempre visível, em toda tela desta
 * fatia (requisito explícito da tarefa). Nunca removido condicionalmente
 * por nenhum estado de UI, para que "consultivo/sintético" nunca deixe
 * de estar visível justamente quando a tela mostra um alerta.
 *
 * O rótulo vinculante "registro limitado a esta instituição" é obrigação
 * de segurança clínica (HAZ-0046; ADR-0004 §6.2 — requisito da ata AQ-1;
 * EC-R1.d de docs/11-security-privacy-compliance/evidencia-carater-consultivo.md):
 * toda superfície que exiba escore/alerta declara os limites do registro
 * que o sustenta — a tela mostra o registro do paciente NESTA instituição,
 * não "o registro do paciente". Correção 1 da revisão única SPR-G7-2.
 */
export function BannerContexto() {
  return (
    <div className="banner-contexto" role="note" aria-label="Aviso de contexto do sistema">
      <strong>CONSULTIVO</strong> — dados 100% sintéticos (SYNTH); não é produção. A decisão clínica
      permanece sempre com o profissional. <strong>Registro limitado a esta instituição</strong> — o
      que está fora do registro desta instituição não aparece nesta tela.
    </div>
  );
}
