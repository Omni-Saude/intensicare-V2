import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta } from "../domain/clinico.js";
import { apelidoDePaciente } from "../domain/clinico.js";
import { textoBandaRisco, textoItemTrabalho } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";
import { ReconhecerAlerta } from "./ReconhecerAlerta.js";

interface PainelAlertasProps {
  alertas: Alerta[];
  cliente: ClienteApiIntensiCare;
  aoAlertaAtualizado: (alertaAtualizado: Alerta) => void;
  tituloRegiao: string;
  /** Repassado a `ReconhecerAlerta` — bloqueia o comando quando offline. */
  comandosBloqueados?: boolean;
}

/** Lista de alertas (item de trabalho) com a ação "Reconhecer alerta". */
export function PainelAlertas({
  alertas,
  cliente,
  aoAlertaAtualizado,
  tituloRegiao,
  comandosBloqueados = false,
}: PainelAlertasProps) {
  if (alertas.length === 0) {
    return (
      <section aria-label={tituloRegiao}>
        <h2>{tituloRegiao}</h2>
        <p>Nenhum alerta neste momento.</p>
      </section>
    );
  }

  return (
    <section aria-label={tituloRegiao}>
      <h2>{tituloRegiao}</h2>
      <ul>
        {alertas.map((alerta) => (
          <li key={alerta.alertaId} className="contribuicao-parametro">
            <div className="contribuicao-parametro__cabecalho">
              {/*
                IA-N10: a referência de paciente é parte IRREMOVÍVEL da linha
                do alerta. Identificar o item só pelo leito falha exatamente
                onde a atribuição errada mais dói — numa transferência, o leito
                é o que muda (HAZ-0001/HAZ-0002).
              */}
              <span>
                {alerta.leitoId} · {apelidoDePaciente(alerta.pacienteRef)}
              </span>
              {/*
                Severidade só é exibida quando o BACKEND a atribuiu. Ausência
                de banda é declarada como ausência — nunca preenchida com um
                nível da escala, que faria um item sem avaliação computável
                parecer um item grave (ADR-0008 N7; ADR-0011 P7; QAS-0017).
              */}
              {alerta.severidade === null ? (
                <BadgeTom texto="Severidade não atribuída." tom="inconclusivo" />
              ) : (
                <BadgeTom {...textoBandaRisco(alerta.severidade)} />
              )}
              <BadgeTom {...textoItemTrabalho(alerta.estado)} />
            </div>
            <p>{alerta.descricao}</p>
            <p>
              <small>Criado em {alerta.criadoEm}</small>
              {alerta.reconhecidoPor && alerta.reconhecidoEm && (
                <small>
                  {" "}
                  · Reconhecido por {alerta.reconhecidoPor} em {alerta.reconhecidoEm}
                </small>
              )}
            </p>
            <ReconhecerAlerta
              alerta={alerta}
              cliente={cliente}
              aoReconhecido={aoAlertaAtualizado}
              comandosBloqueados={comandosBloqueados}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
