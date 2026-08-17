import { useCallback, useEffect, useState } from "react";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { textoAvaliacao, textoBandaRisco } from "../domain/linguagem.js";
import { ROTULO_PARAMETRO } from "../domain/news2.js";
import { combinarConectividade, useConectividadeNavegador } from "../estado/conectividade.js";
import { useRecursoRemoto } from "../estado/recursoRemoto.js";
import { IndicadorConectividade, RotuloFrescorVisao } from "./AvisosDeEstado.js";
import { BadgeTom } from "./BadgeTom.js";
import { ContribuicaoParametroLinha } from "./ContribuicaoParametroLinha.js";
import { EstadoTela } from "./EstadoTela.js";
import { PainelAlertas } from "./PainelAlertas.js";

interface DetalhePacienteProps {
  leitoId: string;
  cliente: ClienteApiIntensiCare;
  aoVoltar: () => void;
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
export function DetalhePaciente({ leitoId, cliente, aoVoltar }: DetalhePacienteProps) {
  const buscar = useCallback(
    (sinal: AbortSignal) => cliente.obterAvaliacaoPaciente(leitoId, { sinal }),
    [cliente, leitoId],
  );

  const recurso = useRecursoRemoto<ItemGradeLeito>({ buscar });
  const conectividadeNavegador = useConectividadeNavegador();
  const marcarLeituraBemSucedida = conectividadeNavegador.marcarLeituraBemSucedida;
  const conectividade = combinarConectividade(
    conectividadeNavegador.estado,
    recurso.exibindoDadoDesatualizado,
  );

  const [item, setItem] = useState<ItemGradeLeito | null>(null);

  useEffect(() => {
    setItem(recurso.dados);
  }, [recurso.dados]);

  useEffect(() => {
    if (recurso.obtidoEm !== null) marcarLeituraBemSucedida();
  }, [recurso.obtidoEm, marcarLeituraBemSucedida]);

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

  return (
    <section aria-labelledby="detalhe-paciente-titulo">
      <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
        ← Voltar à grade de leitos
      </button>
      <h2 id="detalhe-paciente-titulo">{leitoId}</h2>

      <IndicadorConectividade estado={conectividade} />
      <RotuloFrescorVisao frescor={recurso.frescorVisao} obtidoEm={recurso.obtidoEm} />

      <EstadoTela
        estado={recurso.estadoTela}
        contexto={`detalhe do paciente — ${leitoId}`}
        {...(recurso.problema?.detail !== undefined ? { detalhe: recurso.problema.detail } : {})}
        aoTentarNovamente={recurso.recarregar}
        tentativas={recurso.tentativas}
      >
        {item && (
          <>
            <p>{item.pacienteApelido ?? "Leito vago — sem paciente associado."}</p>

            {item.avaliacao === null && <p>Nenhuma avaliação disponível para este leito.</p>}

            {item.avaliacao && (
              <>
                <div className="cartao-leito__linha">
                  <BadgeTom {...textoAvaliacao(item.avaliacao.estadoAvaliacao)} />
                  {item.avaliacao.bandaRisco !== null &&
                    !ESTADOS_FAIL_CLOSED.has(item.avaliacao.estadoAvaliacao) && (
                      <BadgeTom {...textoBandaRisco(item.avaliacao.bandaRisco)} />
                    )}
                </div>

                {ESTADOS_FAIL_CLOSED.has(item.avaliacao.estadoAvaliacao) ? (
                  <p role="alert">
                    Escore NEWS2 não computável: dados insuficientes ou inválidos para calcular com
                    segurança. Nenhum valor é exibido para evitar sugerir "sem risco" a partir de
                    dado ausente (modo fail-closed).
                  </p>
                ) : (
                  <p>
                    Escore NEWS2 total: <strong>{item.avaliacao.news2Total}</strong> — calculado em{" "}
                    {item.avaliacao.calculadoEm ?? "horário desconhecido"} (regra{" "}
                    {item.avaliacao.versaoRegra}).
                  </p>
                )}

                <div className="insumos-declarados">
                  <p>
                    <strong>Insumos ausentes:</strong>{" "}
                    {item.avaliacao.insumosAusentes.length === 0
                      ? "nenhum."
                      : item.avaliacao.insumosAusentes.map((p) => ROTULO_PARAMETRO[p]).join(", ")}
                  </p>
                  <p>
                    <strong>Insumos desatualizados/envelhecidos:</strong>{" "}
                    {item.avaliacao.insumosVelhos.length === 0
                      ? "nenhum."
                      : item.avaliacao.insumosVelhos.map((p) => ROTULO_PARAMETRO[p]).join(", ")}
                  </p>
                </div>

                <h3>Contribuição por parâmetro</h3>
                <ul>
                  {item.avaliacao.contribuicoes.map((contribuicao) => (
                    <ContribuicaoParametroLinha
                      key={contribuicao.parametro}
                      contribuicao={contribuicao}
                    />
                  ))}
                </ul>
              </>
            )}

            <PainelAlertas
              alertas={item.alertas}
              cliente={cliente}
              aoAlertaAtualizado={lidarComAlertaAtualizado}
              tituloRegiao={`Alertas — ${leitoId}`}
              comandosBloqueados={conectividade === "offline"}
            />
          </>
        )}
      </EstadoTela>
    </section>
  );
}
