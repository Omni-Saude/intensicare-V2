import { useEffect, useState } from "react";
import type { ProvedorSessao } from "./api/sessao.js";
import type { ClienteApiIntensiCare } from "./api/tipos.js";
import { AvisoSessao } from "./components/AvisosDeEstado.js";
import { BannerContexto } from "./components/BannerContexto.js";
import { DetalhePaciente } from "./components/DetalhePaciente.js";
import { GaleriaEstados } from "./components/GaleriaEstados.js";
import { GradeLeitos } from "./components/GradeLeitos.js";
import type { EstadoSessao } from "./domain/estados.js";
import { ehPerfilDesenvolvimento, pedeGaleriaDeEstados } from "./perfil.js";

/**
 * Casca de navegação desta fatia (SPR-G7-2): grade de leitos ↔ detalhe
 * do paciente. Sem biblioteca de rotas (nenhuma está instalada nesta
 * fatia — ver README, seção de pendências); a navegação é só estado de
 * React, suficiente para as duas telas exigidas pela tarefa.
 *
 * MUDANÇA DO ACH-07. `App` deixou de CRIAR o cliente: ele agora o RECEBE.
 * A criação (que decide perfil, `?mock` e sessão) mudou para
 * `api/resolverCliente.ts` e é executada por `main.tsx` ANTES de montar a
 * árvore, porque o dublê de desenvolvimento só é alcançável por `import()`
 * dinâmico — o que torna a decisão assíncrona e a recusa em perfil não-dev
 * uma exceção observável, não um `if` silencioso dentro de um render.
 *
 * Efeito colateral desejado: `App` passa a ser testável com qualquer cliente
 * injetado, sem depender de `window.location`.
 */
interface AppProps {
  cliente: ClienteApiIntensiCare;
  sessao: ProvedorSessao;
  /** `window.location.search`; injetável em teste. */
  busca?: string;
}

export function App({ cliente, sessao, busca = "" }: AppProps) {
  const [leitoSelecionado, setLeitoSelecionado] = useState<string | null>(null);
  const [estadoSessao, setEstadoSessao] = useState<EstadoSessao>(() => sessao.estadoAtual());

  // O estado de sessão é ORIGINADO no provedor (S3) — a tela assina, nunca
  // deduz expiração contando tempo por conta própria.
  useEffect(() => {
    setEstadoSessao(sessao.estadoAtual());
    return sessao.assinar(setEstadoSessao);
  }, [sessao]);

  // Galeria de estados: superfície de revisão de UI que renderiza TODOS os
  // identificadores obrigatórios do §11. Só existe em desenvolvimento.
  //
  // `import.meta.env.DEV` vem PRIMEIRO e é literal em tempo de build: sem ele,
  // a condição seria só uma chamada de função e o empacotador não conseguiria
  // provar que o ramo é inalcançável — a galeria inteira vazaria para o
  // pacote de produção (foi exatamente o que aconteceu com
  // `ControleDemonstracao`, detectado pela guarda de bundle).
  if (import.meta.env.DEV && ehPerfilDesenvolvimento() && pedeGaleriaDeEstados(busca)) {
    return (
      <div lang="pt-BR">
        <BannerContexto />
        <main>
          <GaleriaEstados />
        </main>
      </div>
    );
  }

  /**
   * Sessão expirada bloqueia a tela clínica e o dado de paciente deixa de
   * ser renderizado (modelo de estados §4: "limpa dado de paciente do estado
   * de cliente"; IA-N12). O banner de contexto permanece — ele nunca é
   * removido condicionalmente (HAZ-0046).
   */
  if (estadoSessao === "expirada") {
    return (
      <div lang="pt-BR">
        <BannerContexto />
        <main>
          <h1>IntensiCare V2 — Grade de leitos (fatia sintética)</h1>
          <AvisoSessao estado="expirada" />
          <p>
            Nenhum dado de paciente é exibido enquanto a sessão estiver expirada. Reautentique para
            continuar.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div lang="pt-BR">
      <BannerContexto />
      <main>
        <h1>IntensiCare V2 — Grade de leitos (fatia sintética)</h1>
        <AvisoSessao estado={estadoSessao} />
        {leitoSelecionado ? (
          <DetalhePaciente
            leitoId={leitoSelecionado}
            cliente={cliente}
            aoVoltar={() => setLeitoSelecionado(null)}
          />
        ) : (
          <GradeLeitos cliente={cliente} aoSelecionarLeito={setLeitoSelecionado} />
        )}
      </main>
    </div>
  );
}
