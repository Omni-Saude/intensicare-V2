/**
 * vitest.shared.ts — política de execução de teste compartilhada por todo o
 * workspace.
 *
 * POR QUE ESTE ARQUIVO EXISTE. Boa parte das suítes deste repositório sobe um
 * PGlite REAL (PostgreSQL compilado para WASM), aplica migrações do zero e
 * semeia fixtures antes do primeiro caso — de propósito, para que RLS, outbox
 * transacional e auditoria append-only sejam provados contra um motor de
 * verdade e não contra um dublê. Esse arranque custa segundos, e mais ainda em
 * runner de CI com CPU concorrida e cache frio.
 *
 * Com os limites padrão do Vitest (5 s por teste, 10 s por hook), essas suítes
 * falhavam por TEMPO e não por comportamento. Duas vezes isso passou
 * despercebido localmente e só apareceu no CI, em pacotes diferentes: a
 * política estava sendo reescrita pacote a pacote, e bastava alguém criar um
 * pacote novo para o esquecimento voltar.
 *
 * Vermelho intermitente em suíte de segurança clínica é pior que suíte lenta:
 * ensina a equipe a ignorar vermelho. Por isso a política é definida UMA vez,
 * aqui, e cada pacote a estende — inclusive os que hoje não tocam banco, para
 * que passar a tocar não exija lembrar de nada.
 *
 * Estes limites NÃO mascaram lentidão de produto: nenhum caminho de produção
 * sobe banco por requisição. O custo é de bancada de teste.
 */
import type { UserConfig } from "vitest/config";

export const sharedTestConfig = {
  environment: "node",
  testTimeout: 30_000,
  hookTimeout: 60_000,
} satisfies UserConfig["test"];
