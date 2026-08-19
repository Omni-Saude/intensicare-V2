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
import type { LeituraDeProntidao } from "../api/prontidao.js";
import { chavearRazoes, prontidaoObrigaDegradacao } from "../api/prontidao.js";
import type { EstadoConectividade, EstadoSessao, FrescorVisao } from "../domain/estados.js";
import {
  type SituacaoProntidao,
  textoAbaOculta,
  textoCadenciaEspacada,
  textoConectividade,
  textoFrescorVisao,
  textoIdadeDecorrida,
  textoIdadeVisao,
  textoProntidao,
  textoSessao,
} from "../domain/linguagem.js";
import type { Cadencia } from "../estado/cadenciaDeRecarga.js";
import type { ResumoIdadeVisao } from "../estado/idadeVisao.js";
import type { VisibilidadeAba } from "../estado/visibilidade.js";
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
// Idade da visão (LAC-L1)
// ---------------------------------------------------------------------------

interface RotuloIdadeVisaoProps {
  /** `null` quando esta montagem não tem recarga automática — nada é afirmado. */
  idade: ResumoIdadeVisao | null;
  /** Instante ISO da última leitura bem-sucedida, quando conhecido. */
  obtidoEm: string | null;
  /** `true` enquanto uma leitura está em voo (inclusive a periódica). */
  buscaEmCurso?: boolean;
  /**
   * Cadência EFETIVAMENTE agendada, quando conhecida.
   *
   * ELA EXISTE AQUI PARA QUE ESTE RÓTULO SAIBA CALAR-SE (ACH-O3-13). A frase
   * "Releitura automática a cada X" era impressa sempre com o intervalo BASE.
   * Com o backoff no teto, a tela dizia "a cada 30 s" e, três linhas abaixo,
   * `RotuloCadenciaRecarga` dizia "ESPAÇADA — 8× o intervalo normal, agora a
   * cada 4 min": duas descrições divergentes do mesmo fato, exatamente o padrão
   * que ADR-0008 N3 proíbe e que este código cita ao proibi-lo em outro lugar.
   *
   * A correção não é repetir o número aqui (seriam duas fontes a manter em
   * acordo), e sim ter UMA frase por fato: quando a cadência sai do regime,
   * quem a declara é `RotuloCadenciaRecarga`, com o fator e a razão.
   */
  cadencia?: Cadencia | null;
}

/**
 * Idade da visão — o rótulo que faltava para a tela deixar de ser um
 * instantâneo (LAC-L1; ADR-0011 P6 "estado de conexão e frescor no contrato",
 * P8 "polling é o caminho de verdade"; HAZ-0025 "clinicians trust a frozen
 * board"; SAF-0025 "the interface MUST never appear healthy…").
 *
 * DUAS REGIÕES, DE PROPÓSITO — e é a decisão de acessibilidade mais importante
 * deste componente. O NÚMERO da idade muda a cada tique
 * (`INTERVALO_TIQUE_IDADE_MS`); se ele vivesse dentro de uma `aria-live`, um
 * leitor de tela anunciaria "há 5 segundos… há 10 segundos… há 15 segundos"
 * indefinidamente — a rajada que IA-P2/HAZ-0037 proíbem, ocupando o canal que
 * o alerta clínico precisa. Então:
 *
 *   - o número fica FORA de qualquer live region (visível, lido sob demanda);
 *   - só a CLASSE (`no_ciclo` → `ciclo_perdido`) vive numa `role="status"`,
 *     e o texto dela muda apenas na transição — logo é anunciada uma vez.
 *
 * `no_ciclo` não produz selo permanente, pela mesma economia de sinal aplicada
 * a `online` em `IndicadorConectividade`; a idade em texto continua visível.
 */
export function RotuloIdadeVisao({
  idade,
  obtidoEm,
  buscaEmCurso = false,
  cadencia = null,
}: RotuloIdadeVisaoProps) {
  if (idade === null) return null;

  const { texto, tom } = textoIdadeVisao(idade.classe);
  const declara = idade.classe !== "no_ciclo";
  // Fora do regime, a cadência é declarada por `RotuloCadenciaRecarga` — com o
  // fator e a razão. Repeti-la aqui com o intervalo BASE produziria duas
  // descrições divergentes do mesmo fato (ADR-0008 N3).
  const declaraCadencia = cadencia === null || cadencia.classe === "regime";

  return (
    <div
      className="rotulo-idade-visao"
      data-testid="rotulo-idade-visao"
      data-idade-visao={idade.classe}
      data-idade-ms={idade.idadeMs ?? ""}
      data-ciclos-vencidos={idade.ciclosVencidos}
    >
      {/* Só a classe é anunciada — ver a nota de duas regiões acima. */}
      <div role="status" aria-live="polite">
        {declara && <BadgeTom texto={texto} tom={tom} />}
      </div>

      {idade.idadeMs === null ? (
        <p data-testid="idade-visao-texto">Ainda não houve leitura bem-sucedida nesta tela.</p>
      ) : (
        <p data-testid="idade-visao-texto">
          Última leitura bem-sucedida há {textoIdadeDecorrida(idade.idadeMs)}
          {obtidoEm === null ? "" : ` (${obtidoEm})`}.
          {declaraCadencia
            ? ` Releitura automática a cada ${textoIdadeDecorrida(idade.intervaloRecargaMs)}.`
            : ""}
        </p>
      )}

      {idade.classe === "ciclo_perdido" && (
        <p data-testid="idade-visao-ciclos">
          Ciclos de releitura vencidos sem dado novo: {idade.ciclosVencidos}.
        </p>
      )}

      {/*
        "Atualizando…" é informação de transporte e nunca substitui o rótulo
        acima: durante a releitura o conteúdo em tela CONTINUA sendo o anterior,
        e continua rotulado como tal.
      */}
      {buscaEmCurso && <p data-testid="idade-visao-em-curso">Atualizando…</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cadência de releitura (jitter, espaçamento por falha, aba oculta)
// ---------------------------------------------------------------------------

interface RotuloCadenciaRecargaProps {
  /** Cadência EFETIVAMENTE agendada; `null` = nenhuma (recarga desligada). */
  cadencia: Cadencia | null;
  /** Visibilidade da aba — o navegador estrangula temporizadores em segundo plano. */
  visibilidade: VisibilidadeAba;
}

/**
 * Declara, no ponto de uso clínico, TODA razão pela qual a releitura automática
 * não está no regime declarado.
 *
 * ESTE COMPONENTE É O QUE TORNA O BACKOFF ACEITÁVEL. Espaçar a releitura após
 * falhas repetidas alivia um servidor em dificuldade — e, sem declarar, produz
 * exatamente o dano que LAC-L1 fechou: uma tela que se atualiza de 4 em 4
 * minutos com a mesma aparência de uma que se atualiza de 30 em 30 segundos
 * (HAZ-0025; SAF-0025 exige que a interface NUNCA pareça saudável quando não
 * está). O mesmo vale para a aba em segundo plano, onde quem espaça é o
 * navegador e o cliente não tem como impedir.
 *
 * `regime` com a aba visível NÃO produz selo: a mesma economia de sinal já
 * aplicada a `online` e a `no_ciclo`. Um aviso permanente de "está tudo normal"
 * treina o olho a ignorar a região onde o aviso real apareceria.
 *
 * Anúncio POLIDO (`role="status"`): é informação persistente sobre o ciclo da
 * tela, e o canal assertivo fica reservado ao clinicamente urgente
 * (IA-P2/HAZ-0037).
 */
export function RotuloCadenciaRecarga({ cadencia, visibilidade }: RotuloCadenciaRecargaProps) {
  const espacadaPorFalha = cadencia !== null && cadencia.classe === "espacada_por_falha";
  const abaOculta = visibilidade === "oculta";
  if (!espacadaPorFalha && !abaOculta) return null;

  return (
    <div
      className="rotulo-cadencia-recarga"
      data-testid="rotulo-cadencia-recarga"
      data-cadencia={espacadaPorFalha ? "espacada_por_falha" : "regime"}
      data-visibilidade={visibilidade}
      data-fator-espacamento={cadencia?.fator ?? ""}
      role="status"
      aria-live="polite"
    >
      {espacadaPorFalha && cadencia !== null && (
        <BadgeTom {...textoCadenciaEspacada(cadencia.fator, cadencia.esperaMs)} />
      )}
      {abaOculta && <BadgeTom {...textoAbaOculta()} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prontidão do serviço (`GET /v1/readyz`)
// ---------------------------------------------------------------------------

interface AvisoProntidaoProps {
  /** `null` quando esta montagem não observa prontidão — nada é afirmado. */
  leitura: LeituraDeProntidao | null;
}

function situacaoDe(leitura: LeituraDeProntidao): SituacaoProntidao {
  if (leitura.origem === "relatorio" && leitura.veredito !== null) return leitura.veredito;
  if (leitura.origem === "nao_avaliada") return "not_ready";
  return "nao_lida";
}

/**
 * Declaração de prontidão do serviço NO PONTO DE USO CLÍNICO — fechamento do
 * lado frontend de LAC-L2.
 *
 * POR QUE AQUI E NÃO NUM PAINEL DE OPERADOR. `SAF-0025` é literal: "Operator-only
 * dashboards do not satisfy this requirement". `QAS-0023` mede "count of
 * degradations with no user-visible representation: must be zero" — e enquanto
 * `/v1/readyz` respondia 503 permanente sem nenhuma superfície clínica
 * consumindo-o, essa contagem era ≥ 1.
 *
 * O TEXTO DAS RAZÕES É DO SERVIDOR. Cada linha mostra o `codigo` do vocabulário
 * fechado (literal, auditável, referenciável por telemetria — ADR-0021 F1) e o
 * `detalhe` pt-BR redigido pelo backend, verbatim. Este componente não redige
 * frase própria por razão: seriam duas descrições divergentes do mesmo fato
 * (ADR-0008 N3). Um código que esta versão não conhece aparece assim mesmo,
 * marcado — degradação descartada por desconhecimento é degradação silenciosa.
 *
 * `ready` não produz selo permanente: um "tudo certo" fixo é ruído que treina
 * o olho a ignorar a região.
 *
 * Anúncio POLIDO (`role="status"`), não assertivo: este banner qualifica a tela
 * inteira, é persistente e pode coexistir por horas com o alerta clínico de
 * `RegiaoAoVivoAlertas`. Reservar o canal assertivo ao clinicamente urgente é a
 * mesma decisão já tomada em `IndicadorConectividade` (IA-P2/HAZ-0037).
 */
export function AvisoProntidao({ leitura }: AvisoProntidaoProps) {
  if (leitura === null) return null;
  if (!prontidaoObrigaDegradacao(leitura)) return null;

  const situacao = situacaoDe(leitura);
  const { texto, tom } = textoProntidao(situacao);

  return (
    <div
      className="aviso-prontidao"
      data-testid="aviso-prontidao"
      data-prontidao={situacao}
      data-origem-prontidao={leitura.origem}
      data-status-http={leitura.statusHttp ?? ""}
      role="status"
      aria-live="polite"
    >
      <BadgeTom texto={texto} tom={tom} />

      {leitura.razoes.length > 0 ? (
        <>
          <p>Razões declaradas pelo servidor:</p>
          {/*
            `chavearRazoes` (não o código sozinho): OBSERVED contra a API real
            (E2E `recarga-autoritativa.spec.ts`, 2026-08-18) que `/v1/readyz`
            repete o mesmo código com `detalhe` diferente, uma vez por projeção
            sem alvo de frescor validado. São fatos distintos, e nenhum é
            deduplicado — colapsá-los esconderia quantas projeções estão sem
            alvo (QAS-0023 exige contagem ZERO de degradação sem representação).
          */}
          <ul className="aviso-prontidao__razoes">
            {chavearRazoes(leitura.razoes).map(({ chave, razao }) => (
              <li key={chave} data-codigo-razao={razao.codigo}>
                <code>{razao.codigo}</code>
                {razao.detalhe === "" ? "" : ` — ${razao.detalhe}`}
                {razao.reconhecido ? "" : " (código não reconhecido por esta versão da interface)"}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          O servidor não devolveu razões codificadas nesta leitura. Nenhuma razão é suposta aqui.
        </p>
      )}
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
