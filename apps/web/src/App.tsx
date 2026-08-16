import { useState } from "react";
import { criarClienteHttp } from "./api/clienteHttp.js";
import { criarClienteMock } from "./api/clienteMock.js";
import type { ClienteApiIntensiCare } from "./api/tipos.js";
import { BannerContexto } from "./components/BannerContexto.js";
import { GradeLeitos } from "./components/GradeLeitos.js";
import { DetalhePaciente } from "./components/DetalhePaciente.js";

/**
 * Casca de navegação desta fatia (SPR-G7-2): grade de leitos ↔ detalhe
 * do paciente. Sem biblioteca de rotas (nenhuma está instalada nesta
 * fatia — ver README, seção de pendências); a navegação é só estado de
 * React, suficiente para as duas telas exigidas pela tarefa.
 *
 * Integração SPR-G7-2: o cliente padrão é o cliente HTTP REAL do contrato
 * (`criarClienteHttp`, contra `apps/api` via proxy do Vite em dev). O
 * mock permanece disponível para testes de componente e via `?mock` na
 * URL — explicitamente, nunca como fallback silencioso.
 *
 * O cliente de API é criado uma única vez por sessão do app
 * (`useState(() => ...)`, nunca recriado a cada renderização).
 */
function criarClientePadrao(): ClienteApiIntensiCare {
  const querModo =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mock");
  return querModo ? criarClienteMock() : criarClienteHttp();
}

export function App() {
  const [cliente] = useState(() => criarClientePadrao());
  const [leitoSelecionado, setLeitoSelecionado] = useState<string | null>(null);

  return (
    <div lang="pt-BR">
      <BannerContexto />
      <main>
        <h1>IntensiCare V2 — Grade de leitos (fatia sintética)</h1>
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
