/**
 * apps/api/src/schemas.ts — validação de entrada com zod, coerente com
 * `@intensicare/contratos` (`openapi.yaml` + tipos TS). Uma observação
 * inválida vai para quarentena (não rejeita o envelope inteiro); um
 * envelope malformado no nível estrutural (campos-raiz ausentes, corpo
 * não é objeto) é rejeitado com 400 antes de qualquer avaliação.
 *
 * Integração SPR-G7-2: os sete parâmetros do NEWS2 (contrato pt-BR), em
 * duas formas — numérica (`valor` + `unidade`) e codificada (`codigo`,
 * exigida para NivelConsciencia). Forma errada para o parâmetro ⇒
 * quarentena (nunca coerção).
 */
import { z } from "zod";

export const PARAMETRO_CLINICO_VALORES = [
  "FC",
  "FR",
  "PAS",
  "SpO2",
  "FluxoO2",
  "Temperatura",
  "NivelConsciencia",
] as const;

export const parametroClinicoSchema = z.enum(PARAMETRO_CLINICO_VALORES, {
  message: "Parâmetro clínico fora do catálogo aceito nesta fatia.",
});

const observacaoBaseSchema = z.object({
  parametro: parametroClinicoSchema,
  valor: z.number({ message: "O campo valor deve ser numérico e finito." }).finite().optional(),
  unidade: z.string().min(1, { message: "O campo unidade não pode ser vazio." }).optional(),
  codigo: z.string().min(1, { message: "O campo codigo não pode ser vazio." }).optional(),
  coletadoEm: z.iso.datetime({
    offset: true,
    message: "O campo coletadoEm deve ser data/hora ISO 8601 com fuso.",
  }),
});

/**
 * Regras por parâmetro: NivelConsciencia exige `codigo` (token ACVPU);
 * os demais exigem o par numérico `valor` + `unidade`. A forma trocada é
 * rejeitada aqui (⇒ quarentena na rota) — jamais coagida.
 */
export const observacaoEntradaSchema = observacaoBaseSchema.superRefine((obs, ctx) => {
  if (obs.parametro === "NivelConsciencia") {
    if (obs.codigo === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "NivelConsciencia exige codigo (token ACVPU: A/C/V/P/U).",
      });
    }
    return;
  }
  if (obs.valor === undefined || obs.unidade === undefined) {
    ctx.addIssue({
      code: "custom",
      message: `O parâmetro ${obs.parametro} exige valor numérico e unidade.`,
    });
  }
});

export const contextoAvaliacaoSchema = z.object({
  idadeAnos: z.number().finite().nullable().optional(),
  gravidezDocumentada: z.boolean().optional(),
});

export const ingestaoObservacoesRequisicaoSchema = z.object({
  encontroId: z.string().min(1, { message: "O campo encontroId não pode ser vazio." }),
  leitoId: z.string().min(1, { message: "O campo leitoId não pode ser vazio." }),
  pacienteRef: z.string().min(1, { message: "O campo pacienteRef não pode ser vazio." }),
  observacoes: z.array(z.unknown()).min(1, {
    message: "O envelope deve conter ao menos uma observação.",
  }),
  contexto: contextoAvaliacaoSchema.optional(),
});

export const reconhecerAlertaRequisicaoSchema = z.object({
  comentario: z.string().optional(),
});

export const idempotencyKeyHeaderSchema = z
  .string()
  .min(1, { message: "O cabeçalho Idempotency-Key não pode ser vazio." });

export const ifMatchHeaderSchema = z
  .string()
  .regex(/^[0-9]+$/, { message: "O cabeçalho If-Match deve ser um número inteiro de versão." })
  .transform((valor) => Number.parseInt(valor, 10));
