import { useEffect, useState } from "react";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import type { ClienteApiIntensiCare, ModoDemonstracao } from "../api/tipos.js";
import type { EstadoCarregamento } from "../domain/estados.js";
import { EstadoTela } from "./EstadoTela.js";
import { CartaoLeito } from "./CartaoLeito.js";
import { ControleDemonstracao } from "./ControleDemonstracao.js";
import { RegiaoAoVivoAlertas } from "./RegiaoAoVivoAlertas.js";
import { PainelAlertas } from "./PainelAlertas.js";

interface GradeLeitosProps {
  cliente: ClienteApiIntensiCare;
  aoSelecionarLeito: (leitoId: string) => void;
}

const ESTADOS_ALERTA_PENDENTE = new Set(["nao_atribuido", "atribuido", "escalado", "reaberto"]);

function alertasPendentes(itens: ItemGradeLeito[]): Alerta[] {
  return itens.flatMap((item) => item.alertas).filter((alerta) => ESTADOS_ALERTA_PENDENTE.has(alerta.estado));
}

/** Grade de leitos da UTI — tela inicial desta fatia. */
export function GradeLeitos({ cliente, aoSelecionarLeito }: GradeLeitosProps) {
  const [estadoTela, setEstadoTela] = useState<EstadoCarregamento>("carregando");
  const [itens, setItens] = useState<ItemGradeLeito[] | null>(null);
  const [modoDemo, setModoDemo] = useState<ModoDemonstracao | null>(null);
  const [mensagemAoVivo, setMensagemAoVivo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    if (modoDemo === "carregando") {
      // "Forçar: carregando" é, por definição, um estado terminal desta
      // demonstração — nenhuma chamada é feita, a tela permanece
      // mostrando "Carregando…" até o revisor escolher outro modo.
      setEstadoTela("carregando");
      setItens(null);
      return;
    }

    setEstadoTela("carregando");
    cliente.listarGradeLeitos(modoDemo ? { forcarResultado: modoDemo } : undefined).then((resposta) => {
      if (cancelado) return;
      setEstadoTela(resposta.estadoCarregamento);
      setItens(resposta.dados);
      if (resposta.estadoCarregamento === "pronto" && resposta.dados) {
        const pendentes = alertasPendentes(resposta.dados);
        if (pendentes.length > 0) {
          setMensagemAoVivo(
            `${pendentes.length} alerta${pendentes.length === 1 ? "" : "s"} pendente${
              pendentes.length === 1 ? "" : "s"
            } na grade de leitos.`,
          );
        }
      }
    });

    return () => {
      cancelado = true;
    };
  }, [cliente, modoDemo]);

  function lidarComAlertaAtualizado(alertaAtualizado: Alerta) {
    setItens((atual) => {
      if (!atual) return atual;
      return atual.map((item) =>
        item.leitoId === alertaAtualizado.leitoId
          ? {
              ...item,
              alertas: item.alertas.map((a) => (a.alertaId === alertaAtualizado.alertaId ? alertaAtualizado : a)),
            }
          : item,
      );
    });
    setMensagemAoVivo(`Alerta reconhecido em ${alertaAtualizado.leitoId}.`);
  }

  return (
    <section aria-labelledby="grade-leitos-titulo">
      <h2 id="grade-leitos-titulo">Grade de leitos</h2>
      <ControleDemonstracao valor={modoDemo} aoMudar={setModoDemo} />
      <RegiaoAoVivoAlertas mensagem={mensagemAoVivo} />

      <EstadoTela estado={estadoTela} contexto="grade de leitos">
        {itens && (
          <>
            <ul className="grade-leitos">
              {itens.map((item) => (
                <CartaoLeito key={item.leitoId} item={item} aoSelecionar={aoSelecionarLeito} />
              ))}
            </ul>
            <PainelAlertas
              alertas={alertasPendentes(itens)}
              cliente={cliente}
              aoAlertaAtualizado={lidarComAlertaAtualizado}
              tituloRegiao="Alertas ativos"
            />
          </>
        )}
      </EstadoTela>
    </section>
  );
}
