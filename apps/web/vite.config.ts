import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import {
  formatarViolacoes,
  verificarArtefatosSinteticos,
} from "./src/build/guardaArtefatoSintetico.js";

/**
 * Plugin que FALHA O BUILD DE PRODUÇÃO se um artefato sintético chegar ao
 * pacote emitido (ACH-07). A lógica de decisão é pura e testada em
 * `src/build/guardaArtefatoSintetico.test.ts`; aqui só se coleta o conteúdo
 * emitido e se lança.
 *
 * Roda apenas fora de desenvolvimento: em `vite dev` os dublês DEVEM existir.
 */
function guardaArtefatoSintetico(): Plugin {
  let ehProducao = false;

  return {
    name: "intensicare-guarda-artefato-sintetico",
    apply: "build",

    configResolved(configuracao) {
      ehProducao = configuracao.mode === "production" || configuracao.command === "build";
    },

    generateBundle(_opcoes, pacote) {
      if (!ehProducao) return;

      const arquivos: Record<string, string> = {};
      for (const [nome, saida] of Object.entries(pacote)) {
        if (saida.type === "chunk") {
          arquivos[nome] = saida.code;
        } else if (typeof saida.source === "string") {
          arquivos[nome] = saida.source;
        }
      }

      const violacoes = verificarArtefatosSinteticos(arquivos);
      if (violacoes.length > 0) {
        // `this.error` interrompe o build com código de saída não-zero.
        this.error(formatarViolacoes(violacoes));
      }
    },
  };
}

// Integração SPR-G7-2: o fluxo dev aponta para a API local — todo caminho
// `/v1/*` é proxied para `apps/api` (porta 3000; suba com
// `pnpm --filter @intensicare/api dev`). Dados 100% sintéticos.
export default defineConfig({
  plugins: [react(), guardaArtefatoSintetico()],
  server: {
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
