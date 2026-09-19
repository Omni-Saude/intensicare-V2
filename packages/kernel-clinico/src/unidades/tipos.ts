/**
 * Tipos compartilhados dos normalizadores de unidades (ORQ-4) — quantidades
 * marcadas e resultado tipado de conversão.
 *
 * Contrato de rejeição: TODA rejeição é um VALOR de retorno tipado
 * (`ResultadoQuantidade`) — nenhum normalizador lança exceção para caminho
 * esperado de rejeição (kernel puro, PRE-02: mesma entrada ⇒ mesmo resultado,
 * sem efeito colateral).
 *
 * Vocabulário de motivos: APENAS `rejected_missing_inputs` é literal definido
 * pela especificação (docs plan hemodynamics.md §4:301-302 — insumo ausente
 * ⇒ SEM dose, HAZ-028). Os demais literais seguem o MESMO estilo de nomeação
 * do literal da spec e estão PENDENTES DE RATIFICAÇÃO — existem para dar
 * granularidade audível às rejeições, nunca para decidir silenciosamente
 * sobre um valor clinicamente ambíguo.
 *
 * As mensagens de rejeição são curtas, em PT-BR e orientadas à ação: dizem o
 * que está errado e qual a porta correta, sem mascarar o valor ofensor.
 */

declare const marcaQuantidade: unique symbol;

/**
 * Quantidade nominal: um `number` com a marca de domínio `TNome`. O número
 * cru NÃO compila onde a marca é exigida (provas em `./provas-de-tipo.ts`) —
 * a quantidade clínica só existe depois de passar pela porta validada do
 * respectivo domínio.
 */
export type MarcaQuantidade<TNome extends string> = number & {
  readonly [marcaQuantidade]: TNome;
};

export type MotivoRejeicao =
  | "rejected_missing_inputs" // único literal definido pela especificação (hemodynamics §4:301-302)
  | "rejected_categoria_incompativel" // módulo-local; pendente de ratificação
  | "rejected_valor_percentual" // módulo-local; pendente de ratificação
  | "rejected_fora_da_faixa" // módulo-local; pendente de ratificação
  | "rejected_formato_invalido" // módulo-local; pendente de ratificação
  | "rejected_separador_virgula" // módulo-local; pendente de ratificação
  | "rejected_valor_invalido"; // módulo-local; pendente de ratificação

export type ResultadoQuantidade<T> =
  | { readonly status: "convertido"; readonly valor: T }
  | { readonly status: "rejeitado"; readonly motivo: MotivoRejeicao; readonly mensagem: string };
