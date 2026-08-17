/**
 * apps/web/src/main.tsx — ponto de entrada e BOOTSTRAP.
 *
 * O bootstrap é assíncrono porque `resolverCliente` decide perfil, `?mock` e
 * sessão antes de qualquer render, e alcança o dublê de desenvolvimento por
 * `import()` dinâmico (ver `api/resolverCliente.ts`). Consequência desejada:
 * um `?mock` em build não-dev não "passa e é ignorado" — a promessa REJEITA
 * com `RecusaDePerfilError` e a página mostra uma tela de recusa explícita.
 * Recusa observável, não log silencioso (ACH-07).
 *
 * Nenhuma Promise sai deste arquivo sem tratamento final.
 */
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App.js";
import { resolverCliente } from "./api/resolverCliente.js";
import { BannerContexto } from "./components/BannerContexto.js";
import "./estilo.css";
import { RecusaDePerfilError } from "./perfil.js";

const elementoRaiz = document.getElementById("root");
if (!elementoRaiz) {
  throw new Error("Elemento #root não encontrado em index.html.");
}

const raiz: Root = createRoot(elementoRaiz);

/** Tela mostrada enquanto perfil, sessão e cliente são resolvidos. */
function Inicializando() {
  return (
    <div lang="pt-BR">
      <BannerContexto />
      <main>
        <div className="bloco-estado-tela" role="status" aria-live="polite">
          <p>Inicializando…</p>
        </div>
      </main>
    </div>
  );
}

/**
 * Tela de RECUSA. É deliberadamente uma tela e não um `console.error`: uma
 * recusa de perfil que só aparece no console é indistinguível, para quem usa,
 * de uma tela que simplesmente não carregou.
 */
function FalhaDeInicializacao({ erro }: { erro: unknown }) {
  const ehRecusa = erro instanceof RecusaDePerfilError;
  return (
    <div lang="pt-BR">
      <BannerContexto />
      <main>
        <h1>IntensiCare V2</h1>
        <div className="bloco-estado-tela" role="alert" aria-live="assertive">
          <h2>{ehRecusa ? "Recurso de desenvolvimento recusado" : "Falha ao inicializar"}</h2>
          {ehRecusa ? (
            <>
              <p>{(erro as RecusaDePerfilError).message}</p>
              <p>
                Remova o parâmetro da URL e recarregue. Nenhum dado foi carregado e nenhuma
                requisição foi enviada.
              </p>
            </>
          ) : (
            <p>
              Não foi possível preparar a sessão e o cliente de API. Nenhum dado foi carregado.
              Recarregue a página; se persistir, acione o suporte.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

raiz.render(
  <StrictMode>
    <Inicializando />
  </StrictMode>,
);

resolverCliente({ busca: globalThis.location?.search ?? "" })
  .then(({ cliente, sessao }) => {
    raiz.render(
      <StrictMode>
        <App cliente={cliente} sessao={sessao} busca={globalThis.location?.search ?? ""} />
      </StrictMode>,
    );
  })
  .catch((erro: unknown) => {
    raiz.render(
      <StrictMode>
        <FalhaDeInicializacao erro={erro} />
      </StrictMode>,
    );
  });
