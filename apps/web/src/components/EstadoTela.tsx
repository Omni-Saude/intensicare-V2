import type { ReactNode } from "react";
import type { EstadoCarregamento } from "../domain/estados.js";
import { textoCarregamento } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

interface EstadoTelaProps {
  estado: EstadoCarregamento;
  /** Contexto lido por leitor de tela junto do texto de estado (ex.: "grade de leitos"). */
  contexto: string;
  detalhe?: string;
  /**
   * Ação de recuperação. Quando presente e o estado é de falha, um botão
   * "Tentar novamente" é renderizado DENTRO do bloco de alerta — o modelo de
   * estados §5 exige que `erro` tenha "ação de recuperação sempre disponível",
   * e um estado de erro sem saída é apenas uma tela travada com texto bonito.
   */
  aoTentarNovamente?: () => void;
  /**
   * Tentativas desde a última leitura bem-sucedida. Exibida em `retentando`
   * (§5: "contagem de tentativas visível quando repetido").
   */
  tentativas?: number;
  children?: ReactNode;
}

const ESTADOS_QUE_RENDERIZAM_CONTEUDO: EstadoCarregamento[] = ["pronto", "parcial"];

/** Estados de falha: `role="alert"` e ação de recuperação quando houver. */
const ESTADOS_DE_FALHA: ReadonlySet<EstadoCarregamento> = new Set<EstadoCarregamento>([
  "erro",
  "indisponivel",
  "proibido",
  "tempo_esgotado",
]);

/**
 * Wrapper de estado de tela/lista — cobre carregando/vazio/indisponível/
 * proibido/tempo-esgotado/retentando/parcial/erro (prompt §11, 1ª
 * família). `role="status"`/`aria-live="polite"` para que a transição de
 * "carregando" para o resultado seja anunciada sem interromper o
 * usuário; um `erro`/`indisponível` usa `role="alert"` (assertivo), pois
 * exige atenção mais imediata que uma atualização de rotina.
 *
 * ACH-07 acrescentou: ação de recuperação em estados de falha, contagem de
 * tentativas em `retentando`, e `tempo_esgotado`/`retentando` como estados
 * de fato alcançáveis (antes eram apenas valores do union type).
 */
export function EstadoTela({
  estado,
  contexto,
  detalhe,
  aoTentarNovamente,
  tentativas = 0,
  children,
}: EstadoTelaProps) {
  if (ESTADOS_QUE_RENDERIZAM_CONTEUDO.includes(estado)) {
    return (
      <>
        {estado === "parcial" && (
          <div className="bloco-estado-tela" role="status" aria-live="polite">
            <BadgeTom {...textoCarregamento("parcial")} />
          </div>
        )}
        {children}
      </>
    );
  }

  const { texto, tom } = textoCarregamento(estado);
  const ehFalha = ESTADOS_DE_FALHA.has(estado);

  return (
    <div
      className="bloco-estado-tela"
      role={ehFalha ? "alert" : "status"}
      aria-live={ehFalha ? "assertive" : "polite"}
      data-estado={estado}
      data-contexto={contexto}
    >
      <BadgeTom texto={texto} tom={tom} />
      {detalhe && <p>{detalhe}</p>}
      {estado === "retentando" && tentativas > 0 && (
        <p>
          Tentativa {tentativas} desde a última leitura bem-sucedida ({contexto}).
        </p>
      )}
      {ehFalha && aoTentarNovamente && (
        <p>
          <button type="button" className="botao" onClick={aoTentarNovamente}>
            Tentar novamente
          </button>
        </p>
      )}
    </div>
  );
}
