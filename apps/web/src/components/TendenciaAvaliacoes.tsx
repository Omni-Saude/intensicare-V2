/**
 * apps/web/src/components/TendenciaAvaliacoes.tsx
 *
 * A TENDÊNCIA de 24h do detalhe do paciente (MAJ-4 / WF-02) — a série real
 * que o backend publica, com as lacunas que ela tem, e nada além disso.
 *
 * A INVERSÃO DE SEGURANÇA QUE GOVERNA ESTE COMPONENTE (WF-02): alargar a
 * janela nunca fabrica tranquilidade. Janela vazia diz "nenhuma avaliação";
 * um ponto só diz "uma avaliação"; histórico indisponível diz
 * indisponível — nunca uma linha lisa onde não havia dado (HM-03,
 * §6.2/ACH-O3-12: o silêncio vence a normalidade fabricada).
 *
 * POR QUE NÃO HÁ LINHA NENHUMA NO DESENHO. Uma linha entre dois pontos
 * afirma continuidade que o dado não tem — entre as avaliações pode ter
 * havido qualquer coisa, inclusive o período em que o paciente piorou sem
 * ser avaliado. O desenho é de MARCADORES apenas: um por avaliação, na
 * escala fixa 0–20 do NEWS2, ou na faixa superior quando o escore não é
 * computável (o ponto existe; o valor não). A equivalente textual — valor,
 * status e instante por ponto — é a TABELA, que é o conteúdo primário; o
 * SVG é eco visual (`aria-hidden`). O teste deste componente prova a
 * ausência estrutural de `line`/`path`/`polyline`: interpolação é
 * impossível por construção, não por disciplina.
 *
 * FRONTEIRAS (ADR-0011 P7, ADR-0021 F1/F3, LAC-L7): nenhum delta, slope ou
 * rótulo de direção é derivado aqui; nenhum texto de estado é redigido
 * fora de `../domain/linguagem.ts` (`textoAvaliacao`/`textoBandaRisco`);
 * nenhum `Intl.` novo — o instante passa pelo `textoInstante` existente com
 * o valor de máquina no `dateTime`. Sem biblioteca de gráfico: dependência
 * nova em superfície clínica é decisão de cadeia (ADR-0022).
 */
import { useId } from "react";
import type { AvaliacaoPaciente } from "../domain/clinico.js";
import type { Tom } from "../domain/estados.js";
import { glifoTom, textoAvaliacao, textoBandaRisco, textoInstante } from "../domain/linguagem.js";
import {
  chavesDePontos,
  recortarSerie24h,
  type SituacaoSerie,
  situacaoDaSerie,
} from "../domain/serie24h.js";
import { BadgeTom } from "./BadgeTom.js";

/** Ponto já portador da sua chave de renderização (conteúdo, nunca índice). */
interface PontoComChave {
  readonly avaliacao: AvaliacaoPaciente;
  readonly chave: string;
}

interface TendenciaAvaliacoesProps {
  /**
   * A série como o domínio a carrega (`ItemGradeLeito.serieAvaliacoes`):
   * `undefined` = esta origem não consultou o histórico (nada é afirmado);
   * `null` = a consulta falhou (indisponibilidade declarada); `[]` = não
   * há avaliações no período. Os três desfechos são DISTINTOS de propósito.
   */
  readonly serie: AvaliacaoPaciente[] | null | undefined;
  /**
   * Instante de corte da janela, em ms. Injetável para teste determinístico;
   * ausente, é o relógio do ambiente. PREMISSA de apresentação: a janela é
   * 24h porque é o horizonte que a intenção do WF-02 nomeia — não é limiar
   * clínico ratificado.
   */
  readonly agoraMs?: number;
}

/** Mesma regra do bloco principal do detalhe: banda só quando o backend a emitiu e o estado não é fail-closed. */
const ESTADOS_FAIL_CLOSED = new Set(["nao_avaliada", "invalida"]);

/** Cores dos marcadores: as cores de TEXTO dos selos `badge-tom--*` (contraste já medido em `estilo.css`). */
const COR_TOM: Record<Tom, string> = {
  neutro: "#1c2530",
  positivo: "#14532d",
  informativo: "#0b3d66",
  atencao: "#6b4400",
  alerta: "#7a1010",
  critico: "#7a1010",
  inconclusivo: "#3a2a66",
};

const ALTURA_SVG = 84;
const ESCALA_MAX_NEWS2 = 20;

export function TendenciaAvaliacoes({ serie, agoraMs }: TendenciaAvaliacoesProps) {
  // ID POR INSTÂNCIA: `DetalhePaciente` renderiza o mesmo conteúdo DUAS vezes
  // quando exibe dado desatualizado (`exibindoDesatualizado`) — um id fixo
  // aqui colidiria entre as duas cópias e quebraria o `aria-labelledby` da
  // tabela nas duas. `useId` dá a cada cópia o seu par título↔tabela.
  const idTitulo = useId();
  const recorte = recortarSerie24h(serie ?? [], agoraMs ?? Date.now());
  const situacao: SituacaoSerie = situacaoDaSerie(serie, recorte);

  // ECONOMIA DE SINAL (mesma regra de `RotuloFrescorVisao`/`online`): esta
  // origem não consultou o histórico — afirmar "sem tendência" aqui seria
  // falsa afirmação, e afirmar presença seria pior. Não renderiza nada.
  if (situacao === "sem_serie") return null;

  const chaves = chavesDePontos(recorte.pontos);
  const pontos: PontoComChave[] = recorte.pontos.map((ponto, indice) => ({
    avaliacao: ponto.avaliacao,
    chave: chaves[indice] ?? "",
  }));

  const contagemFora =
    recorte.foraDaJanela > 0 ? (
      <p data-testid="tendencia-fora-da-janela">
        {recorte.foraDaJanela === 1
          ? "Uma avaliação mais antiga fica fora do período exibido."
          : `${recorte.foraDaJanela} avaliações mais antigas ficam fora do período exibido.`}
      </p>
    ) : null;

  return (
    <section className="tendencia-avaliacoes" data-testid="tendencia-avaliacoes">
      <h3 id={idTitulo}>Tendência das últimas 24 horas</h3>

      {situacao === "indisponivel" && (
        <p data-testid="tendencia-indisponivel">
          O histórico de avaliações não pôde ser obtido — nenhuma tendência é afirmada.
        </p>
      )}

      {situacao === "vazia" && (
        <p data-testid="tendencia-vazia">Nenhuma avaliação registrada nas últimas 24 horas.</p>
      )}

      {situacao === "ponto_unico" && (
        <p data-testid="tendencia-ponto-unico">Uma avaliação nas últimas 24 horas.</p>
      )}

      {/*
        O DESENHO SÓ EXISTE COM ≥2 PONTOS NA JANELA. Com um ponto só, o fato é
        a frase acima e a linha da tabela — um "gráfico" de um marcador leria
        como estabilidade afirmada onde não há série (a lição de §6.2/ACH-O3-12
        no caso de um ponto). A tabela é o conteúdo canônico em ambos os casos.
      */}
      {situacao === "serie" && (
        <>
          {/*
            O desenho é decoração redundante à tabela (aria-hidden) — a
            leitura canônica da série é a tabela abaixo, valor/status/instante
            por ponto. Marcadores SEM linha nenhuma: continuidade não
            desenhada é continuidade não afirmada.
          */}
          <TendenciaVisual pontos={pontos} />
          <TabelaDaSerie pontos={pontos} idTitulo={idTitulo} />
        </>
      )}

      {situacao === "ponto_unico" && <TabelaDaSerie pontos={pontos} idTitulo={idTitulo} />}

      {contagemFora}
    </section>
  );
}

/** A tabela — equivalente textual canônico da série: valor, status e instante por ponto. */
function TabelaDaSerie({ pontos, idTitulo }: { pontos: PontoComChave[]; idTitulo: string }) {
  return (
    <table data-testid="tendencia-tabela" aria-labelledby={idTitulo}>
      <thead>
        <tr>
          <th scope="col">Avaliação</th>
          <th scope="col">Escore NEWS2</th>
          <th scope="col">Banda</th>
          <th scope="col">Calculado em</th>
        </tr>
      </thead>
      <tbody>
        {pontos.map(({ avaliacao, chave }) => (
          <PontoLinha key={chave} avaliacao={avaliacao} />
        ))}
      </tbody>
    </table>
  );
}

/** Uma linha da tabela: um ponto da série em texto completo. */
function PontoLinha({ avaliacao }: { avaliacao: AvaliacaoPaciente }) {
  const failClosed = ESTADOS_FAIL_CLOSED.has(avaliacao.estadoAvaliacao);
  return (
    <tr data-estado-avaliacao={avaliacao.estadoAvaliacao}>
      <td>
        <BadgeTom {...textoAvaliacao(avaliacao.estadoAvaliacao)} />
      </td>
      <td data-testid="tendencia-escore">
        {failClosed || avaliacao.news2Total === null ? "não computável" : avaliacao.news2Total}
      </td>
      <td>
        {avaliacao.bandaRisco !== null && !failClosed ? (
          <BadgeTom {...textoBandaRisco(avaliacao.bandaRisco)} />
        ) : (
          "—"
        )}
      </td>
      <td>
        {avaliacao.calculadoEm === null ? (
          "horário desconhecido"
        ) : (
          <time dateTime={avaliacao.calculadoEm}>{textoInstante(avaliacao.calculadoEm)}</time>
        )}
      </td>
    </tr>
  );
}

/**
 * Eco visual da série — marcadores puros, sem linha nenhuma. `aria-hidden`:
 * a tabela é o conteúdo; este desenho não pode ser o único caminho para o
 * fato (a tendência que só se vê é um defeito de acessibilidade).
 */
function TendenciaVisual({ pontos }: { pontos: PontoComChave[] }) {
  const passoSerie = 36;
  const largura = Math.max(160, pontos.length * passoSerie);
  const escalaTopo = 28;
  const escalaBase = ALTURA_SVG - 8;
  const yDoEscore = (escore: number) =>
    escalaBase -
    (Math.min(Math.max(escore, 0), ESCALA_MAX_NEWS2) / ESCALA_MAX_NEWS2) *
      (escalaBase - escalaTopo);

  return (
    <svg
      className="tendencia-avaliacoes__visual"
      data-testid="tendencia-visual"
      viewBox={`0 0 ${largura} ${ALTURA_SVG}`}
      width={largura}
      height={ALTURA_SVG}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* Escala fixa e honesta: 0–20, os extremos do NEWS2. Sem eixo, sem grade — decoração. */}
      <text x={2} y={escalaTopo + 4} fontSize={9} fill="#5b6470">
        {ESCALA_MAX_NEWS2}
      </text>
      <text x={2} y={escalaBase} fontSize={9} fill="#5b6470">
        0
      </text>
      {pontos.map(({ avaliacao, chave }, indice) => {
        const x = (indice + 0.5) * passoSerie;
        const failClosed =
          ESTADOS_FAIL_CLOSED.has(avaliacao.estadoAvaliacao) || avaliacao.news2Total === null;
        const { tom } = textoAvaliacao(avaliacao.estadoAvaliacao);
        if (failClosed) {
          // O ponto existe; o valor não. Faixa própria no topo, glifo "?" —
          // nunca um zero, nunca uma omissão.
          return (
            <text
              key={chave}
              x={x}
              y={16}
              textAnchor="middle"
              fontSize={12}
              fill={COR_TOM.inconclusivo}
            >
              {glifoTom("inconclusivo")}
            </text>
          );
        }
        return (
          <g key={chave}>
            <circle cx={x} cy={yDoEscore(avaliacao.news2Total ?? 0)} r={4} fill={COR_TOM[tom]} />
            <text x={x} y={ALTURA_SVG - 0.5} textAnchor="middle" fontSize={9} fill={COR_TOM[tom]}>
              {avaliacao.news2Total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
