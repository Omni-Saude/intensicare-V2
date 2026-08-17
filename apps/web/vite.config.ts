import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Integração SPR-G7-2: o fluxo dev aponta para a API local — todo caminho
// `/v1/*` é proxied para `apps/api` (porta 3000; suba com
// `pnpm --filter @intensicare/api dev`). Dados 100% sintéticos.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
