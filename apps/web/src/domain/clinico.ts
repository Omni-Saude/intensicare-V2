/**
 * apps/web/src/domain/clinico.ts
 *
 * Tipos de domínio clínico usados por esta fatia (grade de leitos,
 * avaliação do paciente com explicação por parâmetro, alertas). Estes
 * tipos são o MODELO DE APRESENTAÇÃO da UI — não o contrato de rede.
 *
 * Integração SPR-G7-2: o contrato real (`@intensicare/contratos`) é
 * dependência declarada deste app; a tradução contrato→UI vive
 * exclusivamente em `../api/clienteHttp.ts` (funções `mapear*`, puras e
 * testadas) — estes tipos NÃO são fonte paralela de verdade do contrato,
 * são a linguagem interna das telas (ADR-0021 F1).
 *
 * Nenhuma alegação de efetividade clínica, conformidade regulatória ou
 * segurança comprovada é feita por este arquivo ou pelos que o consomem.
 */
import type { ModoDeDespachoAvaliacao } from "@intensicare/contratos";
import type { BandaRisco, EstadoAvaliacao, EstadoFrescor, EstadoItemTrabalho } from "./estados.js";

/**
 * Sete parâmetros do NEWS2 (Royal College of Physicians — descrição
 * pública do escore). Reproduzidos aqui apenas para fins ILUSTRATIVOS
 * desta fatia sintética; nenhuma validação clínica desta implementação é
 * afirmada — ver `./news2.ts` para a tabela de pontos e seu aviso.
 */
export type ParametroId =
  | "frequencia_respiratoria"
  | "saturacao_oxigenio"
  | "uso_oxigenio_suplementar"
  | "temperatura"
  | "pressao_arterial_sistolica"
  | "frequencia_cardiaca"
  | "nivel_consciencia";

/** Contribuição de um único parâmetro para o escore, com explicação pt-BR. */
export interface ContribuicaoParametro {
  parametro: ParametroId;
  /** Rótulo clínico pt-BR do parâmetro (para exibição). */
  rotulo: string;
  /** Valor observado — `null` quando o insumo está ausente (nunca 0/omitido silenciosamente). */
  valorObservado: number | string | null;
  unidade?: string;
  /** Pontos atribuídos — `null` quando não computável (insumo ausente/inválido). */
  pontos: number | null;
  frescor: EstadoFrescor;
  /** Horário (ISO 8601) da leitura de origem — `null` se nunca recebida. */
  horarioFonte: string | null;
  /** Explicação clínica pt-BR: por que este ponto foi (ou não foi) atribuído. */
  explicacao: string;
}

/** Avaliação NEWS2 (ilustrativa/sintética) de um paciente em um leito. */
export interface AvaliacaoPaciente {
  estadoAvaliacao: EstadoAvaliacao;
  /** Escore total — `null` quando `estadoAvaliacao` é fail-closed (`nao_avaliada`/`invalida`). */
  news2Total: number | null;
  /** Banda de risco — `null` sob o mesmo fail-closed acima; nunca "baixo" por omissão (HAZ-0005). */
  bandaRisco: BandaRisco | null;
  contribuicoes: ContribuicaoParametro[];
  /** Insumos ausentes DECLARADOS (nunca silenciosamente tratados como normais). */
  insumosAusentes: ParametroId[];
  /** Insumos presentes, mas envelhecidos/desatualizados, DECLARADOS. */
  insumosVelhos: ParametroId[];
  /**
   * Razões legíveis por máquina, originadas no backend (ADR-0008 N3 —
   * `missing_required_input:<insumo>` e similares). O frontend EXIBE estas
   * razões; jamais redige um substituto genérico no lugar delas (ADR-0021 F3).
   */
  motivos: string[];
  /**
   * Anotações obrigatórias visíveis (N-2/N-3/N-4/N-6), em pt-BR, vindas do
   * backend. O contrato as declara obrigatórias na UI — omiti-las é defeito,
   * não simplificação.
   */
  anotacoes: string[];
  /** Explicação agregada pt-BR do backend (spec §7) — o racional de ADR-0021 F8. */
  explicacao: string;
  /**
   * Um parâmetro isolado pontuou o máximo (INV-B, ADR-0026). Sobrevive ao
   * total não computável: IA-N4 exige exibir as duas informações "sem que uma
   * esconda a outra".
   */
  parametroVermelho: boolean;
  /** Horário (ISO 8601) em que o cálculo foi realizado — `null` se nunca calculado. */
  calculadoEm: string | null;
  /**
   * Versão da regra usada (rastreabilidade — ADR-0021 F8). `null` quando a
   * superfície consultada NÃO publica o campo: a projeção da grade não o
   * publica, e afirmar uma versão que não veio do backend é inventar
   * rastreabilidade.
   */
  versaoRegra: string | null;
  /**
   * MODO DE DESPACHO que governou esta avaliação (LAC-L2), transportado do
   * contrato SEM tradução: é o envelope publicado em
   * `ResultadoAvaliacao.despacho` e em `EntradaGradeLeitos.modoAvaliacao`.
   *
   * Reusa o TIPO DO CONTRATO de propósito. Redeclará-lo aqui criaria duas
   * definições estruturalmente idênticas e nenhum gate entre elas — a mesma
   * deriva que o bloco de despacho de `@intensicare/contratos` foi criado
   * para eliminar.
   *
   * OPCIONAL no formato, FECHADO na semântica: ausente ou `null` significa
   * "modo NÃO registrado" e o consumidor DEVE tratar a avaliação como NÃO
   * acionável (`situacaoDeDespacho` abaixo). É opcional pelo mesmo motivo do
   * contrato — respostas gravadas antes desta versão não o carregam —, jamais
   * porque a ausência seja benigna.
   */
  despacho?: ModoDeDespachoAvaliacao | null;
}

/**
 * Rótulo de exibição de um paciente a partir da referência pseudonimizada
 * (`amh:psr:v1:<id>`). Exibe apenas o sufixo — o mínimo que identifica o
 * sujeito na tela sem trafegar a referência inteira em cada superfície
 * (QAS-0028). Nunca é um nome: esta fatia opera exclusivamente sobre dados
 * sintéticos `SYNTH-`.
 */
export function apelidoDePaciente(pacienteRef: string): string {
  const sufixo = pacienteRef.split(":").at(-1) ?? pacienteRef;
  return `Paciente ${sufixo}`;
}

/** Um item da grade de leitos da UTI. */
export interface ItemGradeLeito {
  leitoId: string;
  /** `null` quando o leito está vago (sem paciente sintético associado). */
  pacienteRef: string | null;
  /** Apelido de exibição sintético (nunca um nome real) — `null` se vago. */
  pacienteApelido: string | null;
  avaliacao: AvaliacaoPaciente | null;
  /** Alertas (ativos ou históricos recentes) associados a este leito. */
  alertas: Alerta[];
  /**
   * FRESCOR DA LINHA, tal como o produtor o computou
   * (`EntradaGradeLeitos.frescor`, campo OBRIGATÓRIO do contrato).
   *
   * ELE EXISTE AQUI PORQUE O CLIENTE ESTAVA DERIVANDO O QUE JÁ VINHA PRONTO
   * (ADR-0011 P7). `mapearEntradaGrade` põe `contribuicoes: []` — a projeção
   * da grade é um resumo e não publica insumo por parâmetro — e `CartaoLeito`
   * chamava `calcularFrescorGeral` sobre essa lista vazia. Era a mesma família
   * de LAC-D3 (severidade fabricada), num campo que o servidor entrega pronto.
   *
   * Opcional para que um item MONTADO À MÃO (teste, dublê) não afirme frescor
   * nenhum. O mapeador do cliente sempre o preenche, e preenche fail-closed:
   * valor ausente ou fora do vocabulário vira `ausente`, nunca `atual`.
   */
  frescor?: EstadoFrescor;
  /**
   * MODO DE DESPACHO da avaliação que produziu o escore/banda desta linha
   * (`EntradaGradeLeitos.modoAvaliacao`). Mesma semântica fechada de
   * `AvaliacaoPaciente.despacho`: ausente ou `null` ⇒ NÃO acionável.
   */
  modoAvaliacao?: ModoDeDespachoAvaliacao | null;
}

// ---------------------------------------------------------------------------
// Modo de despacho: leitura fail-closed do envelope (LAC-L2)
// ---------------------------------------------------------------------------

/**
 * Situação do modo de despacho, DERIVADA do envelope do contrato.
 *
 * A FRONTEIRA CLÍNICA, dita às claras. Esta classificação **só sabe
 * rebaixar**. Ela não computa acionabilidade — quem a computa é a projeção do
 * backend, cumulativamente (assinatura verificada + modo acionável + zero
 * bloqueios), e o frontend não tem como verificar assinatura de bundle. O que
 * ela faz é recusar-se a TRATAR COMO ACIONÁVEL aquilo que o servidor não
 * declarou de forma sustentada pelos próprios campos que o acompanham. Nenhum
 * caminho aqui promove nada (ADR-0011 P7; ADR-0021 F3).
 *
 *   - `nao_registrado` — envelope ausente ou `null`. O contrato é literal:
 *     "ausente ou `null` significa modo de despacho NÃO registrado, e o
 *     consumidor DEVE tratar a avaliação como NÃO acionável".
 *   - `incoerente`     — o envelope existe, mas a acionabilidade que ele
 *     declara não é sustentada pelos campos que a acompanham (é a forma exata
 *     do registro fabricado que `DespachoIncoerenteError` rejeita no backend),
 *     ou o envelope não traz o rótulo pt-BR obrigatório. Tratado como NÃO
 *     acionável, e NUNCA "corrigido" para um valor plausível.
 *   - `nao_acionavel`  — o servidor declarou, coerentemente, que a avaliação
 *     NÃO é acionável (sombra rotulada ou recusa). O texto visível deste caso
 *     é o do servidor (`rotuloPt`/`mensagemRecusaPt`), não um redigido aqui.
 *   - `acionavel`      — o servidor declarou acionável e os campos sustentam a
 *     declaração. Estado factual do produto: 0 vias clínicas acionáveis; este
 *     valor existe para que a função seja TOTAL e para que o teste possa
 *     provar que ela não é constante.
 */
export type SituacaoDespacho = "nao_registrado" | "incoerente" | "nao_acionavel" | "acionavel";

export function situacaoDeDespacho(
  envelope: ModoDeDespachoAvaliacao | null | undefined,
): SituacaoDespacho {
  if (envelope === null || envelope === undefined) return "nao_registrado";
  if (typeof envelope !== "object") return "incoerente";

  const { desfecho, modo, acionavel, rotuloPt } = envelope;

  // O contrato obriga o rótulo pt-BR da saída. Sem ele não há o que exibir, e
  // exibir silêncio no lugar de uma degradação é o que QAS-0023 conta como
  // violação.
  if (typeof rotuloPt !== "string" || rotuloPt.trim() === "") return "incoerente";
  if (typeof acionavel !== "boolean") return "incoerente";

  // Recusa: nenhuma avaliação foi produzida. Acionabilidade jamais acompanha
  // uma recusa — se acompanhar, o envelope é fabricado.
  if (desfecho === "nao_avaliada") return acionavel ? "incoerente" : "nao_acionavel";
  if (desfecho !== "avaliada") return "incoerente";

  // Avaliada: o contrato liga `modo: null` à recusa ("null quando o despacho
  // foi recusado antes de haver modo de ativação"), logo uma avaliação sem
  // modo de ativação contradiz o próprio envelope.
  if (modo !== "sombra" && modo !== "acionavel") return "incoerente";
  if (acionavel) return modo === "acionavel" ? "acionavel" : "incoerente";
  return "nao_acionavel";
}

/**
 * Único predicado que a UI consulta para saber se pode tratar a avaliação como
 * acionável. Deliberadamente NÃO é `envelope.acionavel`: ler o booleano cru
 * faria um payload forjado (ou uma linha gravada de forma incoerente) autorizar
 * conduta clínica a partir de uma alegação que nada sustenta.
 */
export function ehDespachoAcionavel(envelope: ModoDeDespachoAvaliacao | null | undefined): boolean {
  return situacaoDeDespacho(envelope) === "acionavel";
}

/**
 * Ordem de severidade de frescor usada por `calcularFrescorGeral` — quanto
 * maior o índice, pior o frescor.
 *
 * ESTA LISTA OMITIA `ausente` E `invalido`, E ISSO ERA UM DEFEITO SILENCIOSO
 * (ACH-O3-12). `indexOf` devolve `-1` para o que não está na lista, e o índice
 * de partida da busca era `0`: `-1 > 0` é SEMPRE falso, de modo que os dois
 * piores estados de frescor nunca elevavam a severidade. Um insumo que o
 * PRODUTOR declarou inválido (`quarantined`/`invalid` em
 * `../api/clienteHttp.ts`) era simplesmente ignorado, e o cartão do leito
 * exibia "✓ Dado atual.", tom positivo, sobre ele. ADR-0011 P7 é explícita:
 * nenhum cliente promove status.
 *
 * A DIREÇÃO DA CORREÇÃO É FAIL-CLOSED: os dois entram, e entram no PIOR
 * extremo. Um insumo inválido ou ausente é o que menos autoriza a tela a dizer
 * que está em dia.
 *
 * VALIDATION REQUIRED (ADR-0029, condição C2 ABERTA). A ORDEM RELATIVA entre
 * estes nove estados é apresentação clínica, não engenharia: quem decide se
 * `invalido` é pior que `expirado`, e se `conflitante` precede `envelhecendo`,
 * é autoridade clínica. O que está aqui é a ordenação provisória herdada, com
 * os dois estados faltantes acrescentados no extremo fail-closed. Nenhum
 * vocabulário novo foi criado: os nove identificadores e seus textos já
 * existiam em `./estados.ts` e `./linguagem.ts`.
 */
const ORDEM_SEVERIDADE_FRESCOR: EstadoFrescor[] = [
  "atual",
  "corrigido",
  "substituido",
  "conflitante",
  "envelhecendo",
  "desatualizado",
  "expirado",
  "ausente",
  "invalido",
];

/**
 * Frescor geral de uma avaliação = o pior frescor entre as contribuições com
 * valor presente. Nunca inventa um frescor melhor que o pior insumo real usado
 * no cálculo — e, desde ACH-O3-12, também não inventa um frescor a partir de
 * NADA.
 *
 * `null` = esta avaliação não publica frescor por insumo, e portanto NADA é
 * afirmado sobre ele. O caso não é hipotético: a projeção da grade é um resumo
 * e devolve `contribuicoes: []` para TODO leito (`mapearEntradaGrade` em
 * `../api/clienteHttp.ts`), de modo que a versão anterior — que devolvia
 * `"atual"` para lista vazia — fazia cada cartão da grade exibir "✓ Dado
 * atual." a partir de zero evidência. Frescor afirmado por ausência de
 * evidência é o oposto de fail-closed; a ausência de afirmação é o resultado
 * correto, e quem consome renderiza nada (`../components/CartaoLeito.tsx`).
 *
 * Contribuição sem valor observado continua fora da conta: insumo ausente é
 * representado à parte (`insumosAusentes`), e o DetalhePaciente o declara
 * nominalmente. O que mudou é que "todas fora da conta" deixou de virar
 * "atual".
 */
export function calcularFrescorGeral(contribuicoes: ContribuicaoParametro[]): EstadoFrescor | null {
  let pior: EstadoFrescor | null = null;
  let indicePior = -1;
  for (const contribuicao of contribuicoes) {
    if (contribuicao.valorObservado === null) continue;
    const indice = ORDEM_SEVERIDADE_FRESCOR.indexOf(contribuicao.frescor);
    // Frescor DESCONHECIDO por esta versão da interface (`indexOf` = -1) não
    // pode ser mais brando que o pior conhecido: fail-closed manda tratá-lo
    // como o pior possível, nunca descartá-lo em silêncio.
    const severidade = indice === -1 ? ORDEM_SEVERIDADE_FRESCOR.length : indice;
    if (severidade > indicePior) {
      indicePior = severidade;
      pior = contribuicao.frescor;
    }
  }
  return pior;
}

/** Um alerta (item de trabalho) associado a um leito/paciente. */
export interface Alerta {
  alertaId: string;
  leitoId: string;
  pacienteRef: string;
  /**
   * Severidade ORIGINADA NO BACKEND. `null` quando o backend não atribuiu
   * banda — o que acontece sempre que a avaliação não é `valida`. Nunca
   * preenchida por omissão: ADR-0011 P7 é explícita em que "nenhuma projeção,
   * gateway ou cliente promove status", e um item sem avaliação computável
   * jamais pode ficar indistinguível de um item genuinamente grave
   * (ADR-0008 N7; QAS-0017).
   */
  severidade: BandaRisco | null;
  descricao: string;
  criadoEm: string;
  estado: EstadoItemTrabalho;
  /**
   * Versão do recurso para concorrência otimista (If-Match — ADR-0009 W3).
   * OBRIGATÓRIA: é a "versão vista" pelo ator humano, e é ela que o comando
   * de reconhecimento carrega. Torná-la opcional convidava o chamador a
   * omiti-la e o cliente a fabricar um valor — que foi exatamente o defeito
   * corrigido aqui.
   */
  versao: number;
  reconhecidoPor?: string;
  reconhecidoEm?: string;
}
