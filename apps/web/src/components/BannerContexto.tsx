/**
 * Banner permanente de contexto — sempre visível, em toda tela desta fatia.
 * Nunca removido condicionalmente por nenhum estado de UI, para que a
 * divulgação não desapareça justamente quando a tela mostra um alerta.
 *
 * DUAS DIVULGAÇÕES, DOIS ELEMENTOS — e a separação é deliberada.
 *
 *   1. **Dados sintéticos / não é produção.** TEMPORÁRIA. Sai quando a fatia
 *      deixar de operar sobre fixtures `SYNTH-`.
 *   2. **Registro limitado a esta instituição.** PERMANENTE e vinculante:
 *      ADR-0004 §6.2, derivada da ata AQ-1, registra que "a UI da V2 DEVE
 *      exibir a limitação ao clínico […] Esta é uma obrigação de segurança
 *      clínica, não uma preferência de UX". Mitiga HAZ-0046 (S4/L4,
 *      Unacceptable; população exposta medida em 4.220 pacientes), cujo dano
 *      é a ausência da divulgação: sem ela, o clínico lê a tela como *o
 *      registro do paciente* e não como *o registro do paciente NESTA
 *      instituição*, e ausência de história prévia vira ausência de evento.
 *
 * Enquanto as duas viviam numa única string, quem removesse a primeira
 * removeria a segunda junto — uma obrigação permanente saindo de carona com
 * uma divulgação transitória. Agora são elementos irmãos e independentes.
 *
 * IDENTIFICADOR ESTÁVEL (RLI-5; teste V1 da ADR-0021): o rótulo institucional
 * carrega `data-divulgacao`, para que telemetria, auditoria e teste provem a
 * exibição SEM depender da redação — que segue provisória até o processo
 * ADR-0029 (condição C2 ABERTA).
 *
 * Rastreio: ADR-0004 §6.2, HAZ-0046, ADR-0021 F1/V1, RLI-1/RLI-2/RLI-5,
 * EC-R1.d de docs/11-security-privacy-compliance/evidencia-carater-consultivo.md.
 */

/** Identificador estável do rótulo institucional — nunca o texto. */
export const ID_DIVULGACAO_REGISTRO_INSTITUCIONAL = "registro-limitado-instituicao";

/** Identificador estável da divulgação de dados sintéticos (temporária). */
export const ID_DIVULGACAO_DADOS_SINTETICOS = "dados-sinteticos";

export function BannerContexto() {
  return (
    <div className="banner-contexto" role="note" aria-label="Aviso de contexto do sistema">
      <p data-testid="divulgacao-dados-sinteticos" data-divulgacao={ID_DIVULGACAO_DADOS_SINTETICOS}>
        <strong>CONSULTIVO</strong> — dados 100% sintéticos (SYNTH); não é produção. A decisão
        clínica permanece sempre com o profissional.
      </p>
      <p
        data-testid="rotulo-registro-institucional"
        data-divulgacao={ID_DIVULGACAO_REGISTRO_INSTITUCIONAL}
      >
        <strong>Registro limitado a esta instituição</strong> — o que está fora do registro desta
        instituição não aparece nesta tela.
      </p>
    </div>
  );
}
