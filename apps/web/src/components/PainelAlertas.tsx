import type { Alerta } from "../domain/clinico.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import { textoBandaRisco, textoItemTrabalho } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";
import { ReconhecerAlerta } from "./ReconhecerAlerta.js";

interface PainelAlertasProps {
  alertas: Alerta[];
  cliente: ClienteApiIntensiCare;
  aoAlertaAtualizado: (alertaAtualizado: Alerta) => void;
  tituloRegiao: string;
}

/** Lista de alertas (item de trabalho) com a ação "Reconhecer alerta". */
export function PainelAlertas({ alertas, cliente, aoAlertaAtualizado, tituloRegiao }: PainelAlertasProps) {
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
              <span>{alerta.leitoId}</span>
              <BadgeTom {...textoBandaRisco(alerta.severidade)} />
              <BadgeTom {...textoItemTrabalho(alerta.estado)} />
            </div>
            <p>{alerta.descricao}</p>
            <p>
              <small>Criado em {alerta.criadoEm}</small>
              {alerta.reconhecidoPor && alerta.reconhecidoEm && (
                <small> · Reconhecido por {alerta.reconhecidoPor} em {alerta.reconhecidoEm}</small>
              )}
            </p>
            <ReconhecerAlerta alerta={alerta} cliente={cliente} aoReconhecido={aoAlertaAtualizado} />
          </li>
        ))}
      </ul>
    </section>
  );
}
