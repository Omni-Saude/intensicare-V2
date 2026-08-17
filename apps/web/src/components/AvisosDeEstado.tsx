/**
 * apps/web/src/components/AvisosDeEstado.tsx
 *
 * Renderização das famílias do §11 que até o ciclo 6 existiam apenas como
 * TIPO em `domain/estados.ts`, sem nenhuma superfície: frescor da visão,
 * conectividade e sessão. ADR-0021 F4 é explícita — "a ausência de um estado
 * obrigatório é defeito bloqueante de revisão, não uma melhoria futura".
 *
 * Nenhum destes componentes decide: cada um recebe um identificador de estado
 * e o traduz via `domain/linguagem.ts`. Nenhum infere severidade clínica,
 * nenhum suprime a exibição de um estado (ADR-0021 F3).
 *
 * Rastreio: ADR-0021 F3/F4, ADR-0029 (texto provisório), HAZ-0037, SAF-0034,
 * WF-05, ACH-07.
 */
import type { EstadoConectividade, EstadoSessao, FrescorVisao } from "../domain/estados.js";
import { textoConectividade, textoFrescorVisao, textoSessao } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

// ---------------------------------------------------------------------------
// Frescor da visão
// ---------------------------------------------------------------------------

interface RotuloFrescorVisaoProps {
  frescor: FrescorVisao;
  /** Instante ISO da última leitura bem-sucedida, quando conhecido. */
  obtidoEm: string | null;
}

/**
 * Rótulo de frescor DA VISÃO. Só aparece quando há algo a declarar — mas
 * quando o conteúdo está desatualizado por falha de recarga, ele é
 * OBRIGATÓRIO e assertivo: exibir dado antigo como atual após erro é o
 * anti-padrão 14 do contrato comum, e o modelo de estados §5 exige que
 * `indisponivel` "nunca mantenha dado velho sem marcação no lugar do erro"
 * (WF-05).
 *
 * O horário da última leitura é mostrado cru (ISO), sem "há 3 minutos":
 * tempo relativo calculado no cliente envelhece sozinho na tela e passaria a
 * mentir se a aba ficasse aberta.
 */
export function RotuloFrescorVisao({ frescor, obtidoEm }: RotuloFrescorVisaoProps) {
  if (frescor === "atual") return null;

  const { texto, tom } = textoFrescorVisao(frescor);
  return (
    <div
      className="rotulo-frescor-visao"
      data-testid="rotulo-frescor-visao"
      data-frescor-visao={frescor}
      role="status"
      aria-live="polite"
    >
      <BadgeTom texto={texto} tom={tom} />
      {obtidoEm !== null && <p>Última leitura bem-sucedida: {obtidoEm}.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conectividade
// ---------------------------------------------------------------------------

interface IndicadorConectividadeProps {
  estado: EstadoConectividade;
}

/**
 * Banner de conectividade (§11, 5ª família). `online` não produz sinal
 * permanente — um banner "tudo certo" ocupando espaço numa tela clínica
 * treina o olho a ignorar a região onde os avisos aparecem.
 *
 * ECONOMIA DE ANÚNCIO ASSERTIVO (decisão de desenho, ACH-07). Apenas
 * `offline` é assertivo. `degradado` é um banner PERSISTENTE e visível, mas
 * anunciado educadamente (`role="status"`): ele qualifica a tela inteira e
 * pode coexistir por minutos com o alerta clínico de `RegiaoAoVivoAlertas` e
 * com o estado de falha de `EstadoTela`. Três regiões assertivas disparando
 * juntas competem entre si e produzem exatamente a "rajada" que IA-P2 e
 * HAZ-0037 proíbem — o anúncio precisa ser coalescido, e o canal assertivo é
 * reservado ao que é clinicamente urgente ou totalmente incapacitante.
 *
 * Persistência visual é preservada: o banner continua na tela, com texto e
 * glifo, independentemente da polidez do anúncio.
 *
 * A orientação de fallback é exibida junto do estado, no ponto de uso
 * (service-blueprint F10: "orientação visível de fallback ao procedimento
 * institucional").
 */
export function IndicadorConectividade({ estado }: IndicadorConectividadeProps) {
  if (estado === "online") return null;

  const { texto, tom } = textoConectividade(estado);
  const assertivo = estado === "offline";
  const orientaFallback = estado === "offline" || estado === "degradado";

  return (
    <div
      className="indicador-conectividade"
      data-testid="indicador-conectividade"
      data-conectividade={estado}
      role={assertivo ? "alert" : "status"}
      aria-live={assertivo ? "assertive" : "polite"}
    >
      <BadgeTom texto={texto} tom={tom} />
      {orientaFallback && (
        <p>
          Enquanto isto durar, use o procedimento institucional de vigilância. Esta tela é
          consultiva e pode não refletir o estado atual do paciente.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

interface AvisoSessaoProps {
  estado: EstadoSessao;
  /** Descrição da ação preservada, quando há trabalho não salvo. */
  trabalhoPendente?: string | null;
}

/**
 * Aviso de sessão (§11, 6ª família). `ativa` não produz sinal permanente.
 *
 * `trabalho_nao_salvo_protegido` declara que a ação foi PRESERVADA e que será
 * reapresentada para confirmação — nunca que foi enviada. Reenvio automático
 * após reautenticação é proibido: a chave de idempotência torna o reenvio
 * seguro APÓS confirmação humana, não no lugar dela (ADR-0009 W2).
 */
export function AvisoSessao({ estado, trabalhoPendente = null }: AvisoSessaoProps) {
  if (estado === "ativa") return null;

  const { texto, tom } = textoSessao(estado);
  const assertivo = estado === "expirada";

  return (
    <div
      className="aviso-sessao"
      data-testid="aviso-sessao"
      data-sessao={estado}
      role={assertivo ? "alert" : "status"}
      aria-live={assertivo ? "assertive" : "polite"}
    >
      <BadgeTom texto={texto} tom={tom} />
      {trabalhoPendente !== null && (
        <p>
          Ação preservada: {trabalhoPendente}. Ela será reapresentada para sua confirmação — nada
          foi enviado automaticamente.
        </p>
      )}
    </div>
  );
}
