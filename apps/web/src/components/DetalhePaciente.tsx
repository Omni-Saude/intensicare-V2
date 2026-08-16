import { useEffect, useState } from "react";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { EstadoCarregamento } from "../domain/estados.js";
import { ROTULO_PARAMETRO } from "../domain/news2.js";
import { textoAvaliacao, textoBandaRisco } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";
import { EstadoTela } from "./EstadoTela.js";
import { ContribuicaoParametroLinha } from "./ContribuicaoParametroLinha.js";
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
 */
export function DetalhePaciente({ leitoId, cliente, aoVoltar }: DetalhePacienteProps) {
  const [estadoTela, setEstadoTela] = useState<EstadoCarregamento>("carregando");
  const [item, setItem] = useState<ItemGradeLeito | null>(null);

  useEffect(() => {
    let cancelado = false;
    setEstadoTela("carregando");
    cliente.obterAvaliacaoPaciente(leitoId).then((resposta) => {
      if (cancelado) return;
      setEstadoTela(resposta.estadoCarregamento);
      setItem(resposta.dados);
    });
    return () => {
      cancelado = true;
    };
  }, [leitoId, cliente]);

  function lidarComAlertaAtualizado(alertaAtualizado: Alerta) {
    setItem((atual) => {
      if (!atual) return atual;
      return {
        ...atual,
        alertas: atual.alertas.map((a) => (a.alertaId === alertaAtualizado.alertaId ? alertaAtualizado : a)),
      };
    });
  }

  return (
    <section aria-labelledby="detalhe-paciente-titulo">
      <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
        ← Voltar à grade de leitos
      </button>
      <h2 id="detalhe-paciente-titulo">{leitoId}</h2>

      <EstadoTela estado={estadoTela} contexto={`detalhe do paciente — ${leitoId}`}>
        {item && (
          <>
            <p>{item.pacienteApelido ?? "Leito vago — sem paciente associado."}</p>

            {item.avaliacao === null && <p>Nenhuma avaliação disponível para este leito.</p>}

            {item.avaliacao && (
              <>
                <div className="cartao-leito__linha">
                  <BadgeTom {...textoAvaliacao(item.avaliacao.estadoAvaliacao)} />
                  {item.avaliacao.bandaRisco !== null && !ESTADOS_FAIL_CLOSED.has(item.avaliacao.estadoAvaliacao) && (
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
                    <ContribuicaoParametroLinha key={contribuicao.parametro} contribuicao={contribuicao} />
                  ))}
                </ul>
              </>
            )}

            <PainelAlertas
              alertas={item.alertas}
              cliente={cliente}
              aoAlertaAtualizado={lidarComAlertaAtualizado}
              tituloRegiao={`Alertas — ${leitoId}`}
            />
          </>
        )}
      </EstadoTela>
    </section>
  );
}
