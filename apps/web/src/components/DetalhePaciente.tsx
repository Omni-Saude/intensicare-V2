import { useCallback, useEffect, useRef, useState } from "react";
import type { LeitorDeProntidao } from "../api/prontidao.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta, AvaliacaoPaciente, ItemGradeLeito } from "../domain/clinico.js";
import type { EstadoConectividade } from "../domain/estados.js";
import { textoAvaliacao, textoBandaRisco } from "../domain/linguagem.js";
import { ROTULO_PARAMETRO } from "../domain/news2.js";
import {
  combinarConectividade,
  refinarComEstadoDoPush,
  useConectividadeNavegador,
} from "../estado/conectividade.js";
import type { ResumoIdadeVisao } from "../estado/idadeVisao.js";
import { useProntidao } from "../estado/prontidao.js";
import { type RelatoDeLeitura, useRelatorioDeLeitura } from "../estado/reconciliacaoObservada.js";
import {
  ehEstadoDeFalha,
  INTERVALO_RECARGA_PADRAO_MS,
  useRecursoRemoto,
} from "../estado/recursoRemoto.js";
import type { Relogio } from "../estado/relogio.js";
import {
  AvisoProntidao,
  IndicadorConectividade,
  RotuloCadenciaRecarga,
  RotuloFrescorVisao,
  RotuloIdadeVisao,
} from "./AvisosDeEstado.js";
import { BadgeTom } from "./BadgeTom.js";
import { ContribuicaoParametroLinha } from "./ContribuicaoParametroLinha.js";
import { EstadoTela } from "./EstadoTela.js";
import { PainelAlertas } from "./PainelAlertas.js";

interface DetalhePacienteProps {
  leitoId: string;
  cliente: ClienteApiIntensiCare;
  aoVoltar: () => void;
  /** Ver a nota equivalente em `GradeLeitos.tsx`. */
  leitorProntidao?: LeitorDeProntidao | null;
  intervaloRecargaMs?: number | null;
  relogio?: Relogio;
  /** Ver a nota equivalente em `GradeLeitos.tsx` (jitter injetável). */
  sortear?: () => number;
  /** Ver a nota equivalente em `GradeLeitos.tsx` (sinal de releitura do push). */
  sinalDeReleitura?: number;
  /** Ver a nota equivalente em `GradeLeitos.tsx` (fato de leitura, ACH-O3-9). */
  aoRelatarLeitura?: (relato: RelatoDeLeitura) => void;
  /** QUARTA origem, aditiva, do booleano de degradação — ver `GradeLeitos.tsx`. */
  degradadoPeloPush?: boolean;
  /** Estado originado no fio; só `reproduzindo`/`reconciliado` chegam por aqui. */
  conectividadeDoPush?: EstadoConectividade | null;
}

const ESTADOS_FAIL_CLOSED = new Set(["nao_avaliada", "invalida"]);

/**
 * Tela de detalhe do paciente: escore, contribuição por parâmetro com
 * explicação pt-BR clínica, insumos ausentes/velhos DECLARADOS (nunca
 * omitidos), timestamps — e os alertas do leito com a ação de
 * reconhecimento.
 *
 * ACH-07: a busca migrou de `.then(...)` sem `.catch` para `useRecursoRemoto`.
 * Trocar de leito ABORTA a requisição do leito anterior — antes, a resposta
 * atrasada de um leito podia chegar depois da troca e ser descartada por uma
 * flag, deixando a nova tela em "carregando" enquanto a antiga já havia
 * respondido.
 */
export function DetalhePaciente({
  leitoId,
  cliente,
  aoVoltar,
  leitorProntidao = null,
  intervaloRecargaMs = INTERVALO_RECARGA_PADRAO_MS,
  relogio,
  sortear,
  sinalDeReleitura = 0,
  aoRelatarLeitura,
  degradadoPeloPush = false,
  conectividadeDoPush = null,
}: DetalhePacienteProps) {
  const buscar = useCallback(
    (sinal: AbortSignal) => cliente.obterAvaliacaoPaciente(leitoId, { sinal }),
    [cliente, leitoId],
  );

  const recurso = useRecursoRemoto<ItemGradeLeito>({
    buscar,
    intervaloRecargaMs,
    ...(relogio !== undefined ? { relogio } : {}),
    ...(sortear !== undefined ? { sortear } : {}),
  });

  const prontidao = useProntidao({
    leitor: leitorProntidao,
    intervaloRecargaMs,
    ...(relogio !== undefined ? { relogio } : {}),
    ...(sortear !== undefined ? { sortear } : {}),
  });

  const conectividadeNavegador = useConectividadeNavegador();
  const marcarLeituraBemSucedida = conectividadeNavegador.marcarLeituraBemSucedida;

  const [item, setItem] = useState<ItemGradeLeito | null>(null);

  useEffect(() => {
    setItem(recurso.dados);
  }, [recurso.dados]);

  /**
   * GUARDA DE IDENTIDADE. O hook preserva o dado anterior numa recarga que
   * falha (invariante I2 — "a tela calma sem dado é proibida"), e isso é
   * correto DENTRO da mesma identidade. Atravessando identidades deixa de
   * ser: exibir o paciente anterior sob o cabeçalho do leito novo é
   * atribuição errada, o dano-raiz de HAZ-0001/HAZ-0002.
   *
   * Só é conteúdo legítimo desta tela o item que pertence a ESTE leito.
   */
  const itemDesteLeito = item !== null && item.leitoId === leitoId ? item : null;

  /**
   * A GUARDA VALE PARA OS RÓTULOS, NÃO SÓ PARA O CONTEÚDO (LAC-L4).
   *
   * Até a navegação direta entre leitos existir, este caminho era inalcançável
   * — grade↔detalhe desmontava o componente e zerava o hook. Com URL por leito,
   * A→B é um `rerender` da MESMA instância: `recurso.dados` continua sendo o
   * item de A enquanto a leitura de B corre e, se ela falhar, o redutor marca
   * `desatualizado_apos_falha` sobre o dado de A.
   *
   * A guarda de identidade suprimia o CONTEÚDO de A — mas `RotuloFrescorVisao`
   * seguia anunciando "o que está na tela é anterior a essa falha" (sobre uma
   * tela onde nada estava) com o TIMESTAMP DE A, e `RotuloIdadeVisao` seguia
   * dizendo "última leitura bem-sucedida há N s" sob o cabeçalho de B, sobre
   * uma leitura que nunca ocorreu em B. Rótulo é afirmação: afirmar frescor de
   * A sob B é a mesma atribuição errada de HAZ-0001/HAZ-0002, só que em prosa.
   *
   * Nada aqui apaga estado do hook (que é de `estado/`, e não desta camada): a
   * tela deixa de EXIBIR como seu o que não é seu. Dentro da mesma identidade
   * todos os rótulos seguem intactos.
   */
  const visaoDeOutroLeito = recurso.dados !== null && itemDesteLeito === null;

  const frescorVisaoExibido = visaoDeOutroLeito ? "atual" : recurso.frescorVisao;
  const obtidoEmExibido = visaoDeOutroLeito ? null : recurso.obtidoEm;
  const idadeVisaoExibida: ResumoIdadeVisao | null =
    !visaoDeOutroLeito || recurso.idadeVisao === null
      ? recurso.idadeVisao
      : {
          // O único fato verdadeiro sobre ESTE leito: ainda não houve leitura
          // bem-sucedida nesta tela. A cadência de referência é preservada
          // porque ela é da TELA, não da leitura.
          classe: "sem_leitura",
          idadeMs: null,
          ciclosVencidos: 0,
          intervaloRecargaMs: recurso.idadeVisao.intervaloRecargaMs,
        };

  /**
   * Conteúdo anterior a uma falha, marcado como desatualizado — o mesmo
   * tratamento que `GradeLeitos` já dava e que esta tela não tinha. Sem ele,
   * o `RotuloFrescorVisao` acima afirmava exibir "conteúdo anterior a essa
   * falha" enquanto abaixo não havia conteúdo nenhum: a tela afirmava o que
   * não mostrava.
   */
  const exibindoDesatualizado = recurso.exibindoDadoDesatualizado && itemDesteLeito !== null;

  // Mesma composição de `GradeLeitos`: falha de leitura, ciclo de releitura
  // perdido e prontidão do serviço, sem que uma esconda a outra. A primeira
  // origem passa pela guarda de identidade: um dado desatualizado que pertence
  // a OUTRO leito não é "degradação desta tela" — sem isto, B falhando com
  // dado de A em memória declarava `degradado`, e B falhando sem dado nenhum
  // declarava `online`, para a mesma falha.
  const conectividade = refinarComEstadoDoPush(
    combinarConectividade(
      conectividadeNavegador.estado,
      exibindoDesatualizado ||
        idadeVisaoExibida?.classe === "ciclo_perdido" ||
        prontidao.degradada ||
        // QUARTA origem, acrescentada DEPOIS das três anteriores e sem apagar
        // nenhuma (ADR-0011 P6/P8).
        degradadoPeloPush,
    ),
    conectividadeDoPush,
  );

  // Ver a nota equivalente em `GradeLeitos.tsx`: o sinal do push vira UMA
  // releitura da projeção autoritativa, e montar com o contador adiantado não
  // dispara requisição extra.
  // ROTINA, não nova tentativa do usuário: um sinal de push não pode fazer a
  // grade desmontar e piscar "Tentando novamente…" (invariante I6).
  const reconciliar = recurso.reconciliar;
  const sinalVistoRef = useRef(sinalDeReleitura);
  useEffect(() => {
    if (sinalDeReleitura === sinalVistoRef.current) return;
    sinalVistoRef.current = sinalDeReleitura;
    reconciliar();
  }, [sinalDeReleitura, reconciliar]);

  useEffect(() => {
    if (recurso.obtidoEm !== null) marcarLeituraBemSucedida();
  }, [recurso.obtidoEm, marcarLeituraBemSucedida]);

  // Ver a nota equivalente em `GradeLeitos.tsx`: é o relato de leitura que
  // autoriza a máquina de push a declarar `reconciliado` (ACH-O3-9).
  useRelatorioDeLeitura({
    buscaEmCurso: recurso.buscaEmCurso,
    obtidoEm: recurso.obtidoEm,
    falhou: ehEstadoDeFalha(recurso.estadoTela),
    sinal: sinalDeReleitura,
    relatar: aoRelatarLeitura,
  });

  function lidarComAlertaAtualizado(alertaAtualizado: Alerta) {
    setItem((atual) => {
      if (!atual) return atual;
      return {
        ...atual,
        alertas: atual.alertas.map((a) =>
          a.alertaId === alertaAtualizado.alertaId ? alertaAtualizado : a,
        ),
      };
    });
  }

  const conteudo = itemDesteLeito && (
    <>
      <p>{itemDesteLeito.pacienteApelido ?? "Leito vago — sem paciente associado."}</p>

      {itemDesteLeito.avaliacao === null && <p>Nenhuma avaliação disponível para este leito.</p>}

      {itemDesteLeito.avaliacao && (
        <>
          <div className="cartao-leito__linha">
            <BadgeTom {...textoAvaliacao(itemDesteLeito.avaliacao.estadoAvaliacao)} />
            {itemDesteLeito.avaliacao.bandaRisco !== null &&
              !ESTADOS_FAIL_CLOSED.has(itemDesteLeito.avaliacao.estadoAvaliacao) && (
                <BadgeTom {...textoBandaRisco(itemDesteLeito.avaliacao.bandaRisco)} />
              )}
            {/*
              INV-B (ADR-0026) / IA-N4: um parâmetro isolado no extremo escala
              mesmo com o total não computável, e a UI "exibe as duas
              informações sem que uma esconda a outra". Descartado no
              mapeamento, este sinal ficava invisível justamente quando não há
              escore para carregá-lo.
            */}
            {itemDesteLeito.avaliacao.parametroVermelho && (
              <BadgeTom texto="Parâmetro isolado no extremo." tom="alerta" />
            )}
          </div>

          {ESTADOS_FAIL_CLOSED.has(itemDesteLeito.avaliacao.estadoAvaliacao) ? (
            <div role="alert">
              <p>
                Escore NEWS2 não computável: nenhum valor é exibido para evitar sugerir "sem risco"
                a partir de dado ausente (modo fail-closed).
              </p>
              {/*
                As RAZÕES são do backend (ADR-0008 N3), não desta tela. Antes,
                um parágrafo genérico escrito aqui ocupava o lugar delas — o
                frontend redigindo racional clínico, que é exatamente o que
                ADR-0021 F3 proíbe, no estado mais crítico que existe.
              */}
              <ExplicacaoDoBackend avaliacao={itemDesteLeito.avaliacao} />
            </div>
          ) : (
            <>
              <p>
                Escore NEWS2 total: <strong>{itemDesteLeito.avaliacao.news2Total}</strong> —
                calculado em {itemDesteLeito.avaliacao.calculadoEm ?? "horário desconhecido"}
                {itemDesteLeito.avaliacao.versaoRegra === null
                  ? "."
                  : ` (regra ${itemDesteLeito.avaliacao.versaoRegra}).`}
              </p>
              <ExplicacaoDoBackend avaliacao={itemDesteLeito.avaliacao} />
            </>
          )}

          <div className="insumos-declarados">
            <p>
              <strong>Insumos ausentes:</strong>{" "}
              {itemDesteLeito.avaliacao.insumosAusentes.length === 0
                ? "nenhum."
                : itemDesteLeito.avaliacao.insumosAusentes
                    .map((p) => ROTULO_PARAMETRO[p])
                    .join(", ")}
            </p>
            <p>
              <strong>Insumos desatualizados/envelhecidos:</strong>{" "}
              {itemDesteLeito.avaliacao.insumosVelhos.length === 0
                ? "nenhum."
                : itemDesteLeito.avaliacao.insumosVelhos.map((p) => ROTULO_PARAMETRO[p]).join(", ")}
            </p>
          </div>

          <h3>Contribuição por parâmetro</h3>
          <ul>
            {itemDesteLeito.avaliacao.contribuicoes.map((contribuicao) => (
              <ContribuicaoParametroLinha
                key={contribuicao.parametro}
                contribuicao={contribuicao}
              />
            ))}
          </ul>
        </>
      )}

      <PainelAlertas
        alertas={itemDesteLeito.alertas}
        cliente={cliente}
        aoAlertaAtualizado={lidarComAlertaAtualizado}
        tituloRegiao={`Alertas — ${leitoId}`}
        comandosBloqueados={conectividade === "offline"}
      />
    </>
  );

  return (
    <section aria-labelledby="detalhe-paciente-titulo">
      <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
        ← Voltar à grade de leitos
      </button>
      <h2 id="detalhe-paciente-titulo">{leitoId}</h2>

      <IndicadorConectividade estado={conectividade} />
      <AvisoProntidao leitura={prontidao.leitura} />
      <RotuloFrescorVisao frescor={frescorVisaoExibido} obtidoEm={obtidoEmExibido} />
      <RotuloIdadeVisao
        idade={idadeVisaoExibida}
        obtidoEm={obtidoEmExibido}
        buscaEmCurso={recurso.buscaEmCurso}
        cadencia={recurso.cadencia}
      />
      <RotuloCadenciaRecarga cadencia={recurso.cadencia} visibilidade={recurso.visibilidadeDaAba} />

      <EstadoTela
        estado={recurso.estadoTela}
        contexto={`detalhe do paciente — ${leitoId}`}
        {...(recurso.problema?.detail !== undefined ? { detalhe: recurso.problema.detail } : {})}
        aoTentarNovamente={recurso.recarregar}
        tentativas={recurso.tentativas}
      >
        {conteudo}
      </EstadoTela>

      {/*
        Mesmo tratamento que `GradeLeitos` já dava: numa falha de recarga o
        conteúdo anterior continua visível — `EstadoTela` declarou o erro
        acima e `RotuloFrescorVisao` marcou o conteúdo como não-atual. Sem
        este bloco, o rótulo afirmava exibir conteúdo anterior à falha
        enquanto a tela ficava vazia. `itemDesteLeito` garante que o que
        sobrevive à falha pertence a ESTE leito.
      */}
      {exibindoDesatualizado && <div className="detalhe-paciente--desatualizado">{conteudo}</div>}
    </section>
  );
}

/**
 * Racional produzido pelo BACKEND: razões codificadas (ADR-0008 N3),
 * anotações obrigatórias (N-2/N-3/N-4/N-6) e explicação agregada. A camada de
 * apresentação decide COMO isto aparece — nunca SE aparece (ADR-0021 F8).
 */
function ExplicacaoDoBackend({ avaliacao }: { avaliacao: AvaliacaoPaciente }) {
  const temAlgo =
    avaliacao.explicacao.length > 0 ||
    avaliacao.anotacoes.length > 0 ||
    avaliacao.motivos.length > 0;
  if (!temAlgo) return null;

  return (
    <div className="explicacao-backend">
      {avaliacao.explicacao.length > 0 && <p>{avaliacao.explicacao}</p>}
      {avaliacao.anotacoes.length > 0 && (
        <ul>
          {avaliacao.anotacoes.map((anotacao) => (
            <li key={anotacao}>{anotacao}</li>
          ))}
        </ul>
      )}
      {avaliacao.motivos.length > 0 && (
        <p>
          <strong>Razões registradas:</strong> <code>{avaliacao.motivos.join(", ")}</code>
        </p>
      )}
    </div>
  );
}
