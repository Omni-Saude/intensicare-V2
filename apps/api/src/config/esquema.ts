/**
 * Forma tipada da configuração de runtime e sua validação final com zod.
 *
 * O schema zod aqui é usado como GUARDA, não como transformador: o carregador
 * monta o objeto, congela, valida e devolve o ORIGINAL. Isso preserva a
 * identidade da classe `Segredo` e o congelamento — um `parse()` cujo
 * resultado fosse devolvido produziria um clone mutável, e o hábito de mutar
 * configuração depois do boot é justamente o que "validada antes de abrir a
 * porta" existe para impedir.
 *
 * Nenhum campo tem valor padrão embutido no schema (`.default(` não aparece em
 * módulo nenhum deste diretório, e há teste que varre o código-fonte para
 * garantir isso): todo padrão vive na tabela de `variaveis.ts`, escopado por
 * perfil e varrido por teste.
 */
import { z } from "zod";
import type { BannerRuntime } from "./banner.js";
import { type ClassePerfil, PERFIS, type Perfil } from "./perfis.js";
import { Segredo } from "./segredo.js";
import {
  MODOS_BANCO,
  MODOS_IDENTIDADE,
  MODOS_MIGRACAO,
  type ModoBanco,
  type ModoIdentidade,
  type ModoMigracao,
} from "./variaveis.js";

export interface ConfiguracaoBanco {
  readonly modo: ModoBanco;
  /** `null` em modo `pglite-memoria`, onde não existe URL a conectar. */
  readonly url: string | null;
  readonly usuario: string | null;
  readonly senha: Segredo | null;
  readonly semearFixturesSinteticas: boolean;
}

export interface ConfiguracaoIdentidade {
  readonly modo: ModoIdentidade;
  readonly emissor: string | null;
  readonly audiencia: string | null;
  readonly jwksUrl: string | null;
}

export interface ConfiguracaoBundleRegra {
  readonly caminho: string;
  /** Chave PÚBLICA de verificação — não é segredo, mas é obrigatória. */
  readonly chavePublica: string;
}

export interface ConfiguracaoMigracao {
  readonly modo: ModoMigracao;
  readonly timeoutMs: number;
  readonly lockId: number;
  readonly permitirDestrutiva: boolean;
  readonly janelaCompatibilidade: number;
}

export interface ConfiguracaoRuntime {
  readonly perfil: Perfil;
  readonly classePerfil: ClassePerfil;
  readonly porta: number;
  readonly banco: ConfiguracaoBanco;
  readonly identidade: ConfiguracaoIdentidade;
  readonly bundleRegra: ConfiguracaoBundleRegra | null;
  readonly migracao: ConfiguracaoMigracao;
  /** `null` em perfil produtivo — nada a anunciar. */
  readonly banner: BannerRuntime | null;
  /** Mesma lista do banner, promovida ao topo para consumo pela prontidão. */
  readonly limitacoes: readonly string[];
  readonly modoDegradado: boolean;
}

const esquemaBanner = z.object({
  perfil: z.enum(PERFIS),
  titulo: z.string().min(1),
  limitacoes: z.array(z.string().min(1)),
});

export const esquemaConfiguracaoRuntime = z.object({
  perfil: z.enum(PERFIS),
  classePerfil: z.enum(["sintetico", "integracao", "produtivo"]),
  porta: z.number().int().min(1).max(65535),
  banco: z.object({
    modo: z.enum(MODOS_BANCO),
    url: z.string().min(1).nullable(),
    usuario: z.string().min(1).nullable(),
    senha: z.instanceof(Segredo).nullable(),
    semearFixturesSinteticas: z.boolean(),
  }),
  identidade: z.object({
    modo: z.enum(MODOS_IDENTIDADE),
    emissor: z.string().min(1).nullable(),
    audiencia: z.string().min(1).nullable(),
    jwksUrl: z.string().min(1).nullable(),
  }),
  bundleRegra: z.object({ caminho: z.string().min(1), chavePublica: z.string().min(1) }).nullable(),
  migracao: z.object({
    modo: z.enum(MODOS_MIGRACAO),
    timeoutMs: z.number().int().min(1000).max(600_000),
    lockId: z.number().int().min(0),
    permitirDestrutiva: z.boolean(),
    janelaCompatibilidade: z.number().int().min(1).max(100),
  }),
  banner: esquemaBanner.nullable(),
  limitacoes: z.array(z.string().min(1)),
  modoDegradado: z.boolean(),
});
