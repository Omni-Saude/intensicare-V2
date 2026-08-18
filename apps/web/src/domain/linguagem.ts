/**
 * apps/web/src/domain/linguagem.ts
 *
 * Módulo de linguagem — a camada de apresentação dona do texto pt-BR
 * (ADR-0021 F1/F3, direção aceita em GDEC-0016). Cada função aqui é uma
 * TRADUÇÃO TOTAL (switch exaustivo, nunca um `default` silencioso) de um
 * identificador de estado (`./estados.ts`, "vem do backend" na forma real
 * — ver nota de integração pendente lá) para texto pt-BR + tom semântico.
 *
 * Regras que este módulo NUNCA viola (ADR-0021 F3):
 *   - nunca suprime a exibição de um estado;
 *   - nunca promove/rebaixa severidade;
 *   - nunca infere um estado que o identificador de entrada não contém.
 * Cada mapeamento é 1:1 e total — adicionar um novo valor ao union type em
 * `./estados.ts` quebra a compilação aqui (switch exaustivo) até que este
 * arquivo seja atualizado, por desenho.
 *
 * As escolhas de redação abaixo seguem a "lista semente de ambiguidade
 * proibida" da ADR-0029 §4 Opção A (P1-P9) — citada por item onde
 * aplicável. Nenhum termo aqui é uma ratificação formal de glossário
 * (isso pertence ao processo da ADR-0029, condição C2, ainda ABERTA);
 * este é texto provisório de fatia sintética, sujeito a revisão.
 */
import {
  type BandaRisco,
  casoImpossivel,
  type EstadoAvaliacao,
  type EstadoCarregamento,
  type EstadoConectividade,
  type EstadoFrescor,
  type EstadoItemTrabalho,
  type EstadoSessao,
  type FrescorVisao,
  type IdadeVisao,
  type Tom,
} from "./estados.js";

/** Par texto+tom retornado por toda função de tradução deste módulo. */
export interface TextoComTom {
  texto: string;
  tom: Tom;
}

export function textoCarregamento(estado: EstadoCarregamento): TextoComTom {
  switch (estado) {
    case "carregando":
      return { texto: "Carregando…", tom: "neutro" };
    case "vazio":
      return { texto: "Nenhum item encontrado.", tom: "neutro" };
    case "indisponivel":
      return { texto: "Indisponível no momento — não foi possível obter os dados.", tom: "alerta" };
    case "proibido":
      return { texto: "Acesso não autorizado a este recurso.", tom: "alerta" };
    case "tempo_esgotado":
      return { texto: "Tempo de resposta esgotado.", tom: "atencao" };
    case "retentando":
      return { texto: "Tentando novamente…", tom: "atencao" };
    case "parcial":
      // P7 (ADR-0029): "parcial" nunca é redigido como "quase completo".
      return {
        texto: "Carregado parcialmente — alguns itens podem estar ausentes.",
        tom: "atencao",
      };
    case "pronto":
      return { texto: "Carregado.", tom: "neutro" };
    case "erro":
      return { texto: "Não foi possível carregar. Tente novamente.", tom: "alerta" };
    default:
      return casoImpossivel(estado, "textoCarregamento");
  }
}

export function textoFrescor(estado: EstadoFrescor): TextoComTom {
  switch (estado) {
    case "atual":
      return { texto: "Dado atual.", tom: "positivo" };
    case "envelhecendo":
      return {
        texto: "Dado envelhecendo — aproximando-se do limite de frescor esperado.",
        tom: "atencao",
      };
    case "desatualizado":
      // P8 (ADR-0029): "desatualizado" (stale) é distinto de "ausente" (missing).
      return {
        texto: "Dado desatualizado (obsoleto) — não reflete necessariamente o estado atual.",
        tom: "alerta",
      };
    case "expirado":
      return { texto: "Dado expirado — fora da janela de validade.", tom: "critico" };
    case "ausente":
      // P8 (ADR-0029): "ausente" (missing) é distinto de "desatualizado" (stale).
      return { texto: "Dado indisponível — nenhuma leitura recebida.", tom: "inconclusivo" };
    case "invalido":
      return { texto: "Dado inválido — não utilizável para cálculo.", tom: "inconclusivo" };
    case "conflitante":
      return { texto: "Dado conflitante — mais de uma origem diverge.", tom: "atencao" };
    case "corrigido":
      return {
        texto: "Dado corrigido — um valor anterior foi substituído por correção registrada.",
        tom: "informativo",
      };
    case "substituido":
      return { texto: "Dado substituído por uma leitura mais recente.", tom: "informativo" };
    default:
      return casoImpossivel(estado, "textoFrescor");
  }
}

export function textoAvaliacao(estado: EstadoAvaliacao): TextoComTom {
  switch (estado) {
    case "valida":
      return { texto: "Avaliação válida.", tom: "positivo" };
    case "parcial":
      return {
        texto: "Avaliação parcial — calculada com insumos incompletos, declarados abaixo.",
        tom: "atencao",
      };
    case "nao_avaliada":
      // P1 (ADR-0029/HAZ-0005): NUNCA redigir com vocabulário tranquilizador.
      return {
        texto:
          "Avaliação não computável — dados insuficientes para calcular com segurança (modo fail-closed).",
        tom: "inconclusivo",
      };
    case "desatualizada":
      return {
        texto: "Avaliação desatualizada — recalcule antes de decidir com base nela.",
        tom: "atencao",
      };
    case "invalida":
      return {
        texto: "Avaliação inválida — não deve ser usada para decisão clínica.",
        tom: "inconclusivo",
      };
    default:
      return casoImpossivel(estado, "textoAvaliacao");
  }
}

export function textoItemTrabalho(estado: EstadoItemTrabalho): TextoComTom {
  switch (estado) {
    case "nao_atribuido":
      return { texto: "Não atribuído.", tom: "neutro" };
    case "atribuido":
      return { texto: "Atribuído.", tom: "informativo" };
    case "reconhecido":
      // P5 (ADR-0029): "reconhecido" (ciência) é distinto de "resolvido" (encerramento).
      return { texto: "Ciência registrada (reconhecido).", tom: "positivo" };
    case "escalado":
      return { texto: "Escalado.", tom: "alerta" };
    case "sobreposto":
      return {
        texto: "Sobreposto manualmente — decisão registrada por um profissional.",
        tom: "atencao",
      };
    case "resolvido":
      return { texto: "Resolvido — encerrado.", tom: "positivo" };
    case "suprimido":
      // P6 (ADR-0029): supressão é sempre ato explícito e auditável, nunca ausência silenciosa.
      return {
        texto: "Suprimido — ocultação explícita e auditável, registrada por um profissional.",
        tom: "atencao",
      };
    case "reaberto":
      return { texto: "Reaberto.", tom: "alerta" };
    default:
      return casoImpossivel(estado, "textoItemTrabalho");
  }
}

export function textoConectividade(estado: EstadoConectividade): TextoComTom {
  switch (estado) {
    case "online":
      return { texto: "Conectado.", tom: "positivo" };
    case "degradado":
      return {
        texto:
          "Modo degradado — algumas funcionalidades limitadas; dados podem não estar atualizados.",
        tom: "atencao",
      };
    case "offline":
      return { texto: "Offline — sem conexão com o servidor.", tom: "alerta" };
    case "reconectando":
      return { texto: "Reconectando…", tom: "atencao" };
    case "reproduzindo":
      return { texto: "Sincronizando eventos perdidos…", tom: "informativo" };
    case "reconciliado":
      return { texto: "Sincronizado — dados reconciliados após reconexão.", tom: "informativo" };
    default:
      return casoImpossivel(estado, "textoConectividade");
  }
}

/**
 * Texto da 6ª família do §11 (sessão). A redação segue a PROPOSTA já
 * registrada em `docs/10-ux-and-accessibility/modelo-de-estados-obrigatorios.md`
 * §4 — transcrita, não inventada aqui.
 *
 * VALIDATION REQUIRED (ADR-0029, condição C2 ABERTA): nenhum destes textos é
 * terminologia ratificada. `expirada` nunca é redigida de forma que sugira
 * que a ação pendente foi concluída, e `trabalho_nao_salvo_protegido` nunca
 * afirma reenvio automático — a chave de idempotência permite reenvio seguro
 * APÓS confirmação humana (ADR-0009 W2).
 */
export function textoSessao(estado: EstadoSessao): TextoComTom {
  switch (estado) {
    case "ativa":
      return { texto: "Sessão ativa.", tom: "positivo" };
    case "expirando":
      return {
        texto: "Sua sessão expira em breve — salve ou conclua a ação em andamento.",
        tom: "atencao",
      };
    case "expirada":
      return { texto: "Sessão expirada — reautentique para continuar.", tom: "alerta" };
    case "recuperada":
      return { texto: "Sessão recuperada.", tom: "informativo" };
    case "trabalho_nao_salvo_protegido":
      return { texto: "Há uma ação não concluída — ela não foi perdida.", tom: "atencao" };
    default:
      return casoImpossivel(estado, "textoSessao");
  }
}

/**
 * Texto do frescor DA VISÃO (ACH-07). Note o contraste deliberado com
 * `textoFrescor`: aqui não se afirma nada sobre o dado clínico em si — apenas
 * sobre o que a TELA está mostrando em relação à última tentativa de leitura.
 *
 * P8 (ADR-0029) vale igualmente: "desatualizado" nunca é redigido como
 * "indisponível", e o texto nunca sugere que o conteúdo exibido é atual.
 *
 * VALIDATION REQUIRED (ADR-0029 C2 ABERTA) — redação provisória.
 */
export function textoFrescorVisao(frescor: FrescorVisao): TextoComTom {
  switch (frescor) {
    case "atual":
      return { texto: "Conteúdo da última leitura bem-sucedida.", tom: "neutro" };
    case "desatualizado_apos_falha":
      return {
        texto:
          "Conteúdo desatualizado — a última tentativa de atualização falhou. " +
          "O que está na tela é anterior a essa falha e pode não refletir o estado atual.",
        tom: "alerta",
      };
    default:
      return casoImpossivel(frescor, "textoFrescorVisao");
  }
}

/**
 * Texto da IDADE DA VISÃO (LAC-L1). Note o que estas frases NÃO dizem: nenhuma
 * delas afirma que o dado clínico está velho, envelhecendo ou fora de janela.
 * Elas falam apenas do CICLO DE RECARGA DESTA TELA, cuja cadência é premissa
 * reversível de engenharia (`INTERVALO_RECARGA_PADRAO_MS`). O frescor do
 * insumo clínico é `textoFrescor` acima, e vem do backend (ADR-0008 N5,
 * ADR-0011 P7).
 *
 * `no_ciclo` devolve tom `neutro` e NÃO é renderizado como selo permanente
 * (ver `../components/AvisosDeEstado.tsx`): um "está tudo atualizado" fixo
 * numa tela clínica treina o olho a ignorar a região onde o aviso real
 * apareceria — a mesma economia de sinal já aplicada a `online`.
 *
 * VALIDATION REQUIRED (ADR-0029 C2 ABERTA) — redação provisória de engenharia.
 */
export function textoIdadeVisao(idade: IdadeVisao): TextoComTom {
  switch (idade) {
    case "sem_leitura":
      return {
        texto: "Nenhuma leitura bem-sucedida ainda — nada nesta tela foi confirmado pelo servidor.",
        tom: "inconclusivo",
      };
    case "no_ciclo":
      return { texto: "Releitura automática em regime.", tom: "neutro" };
    case "ciclo_perdido":
      // P8 (ADR-0029): nunca redigido como "indisponível"; e nunca como
      // "dado desatualizado", que é afirmação clínica que esta tela não faz.
      return {
        texto:
          "A releitura automática não está produzindo dado novo — o conteúdo abaixo é " +
          "anterior ao último ciclo de atualização e pode não refletir o estado atual.",
        tom: "alerta",
      };
    default:
      return casoImpossivel(idade, "textoIdadeVisao");
  }
}

/**
 * Idade decorrida em pt-BR, FACTUAL e sem adjetivo. Deliberadamente sem
 * "há pouco", "recente" ou "há muito tempo": qualquer um desses seria um juízo
 * de suficiência que ninguém ratificou (VAL-0023, `VALIDATION REQUIRED`).
 *
 * A precisão cai com a magnitude (segundos → minutos → horas) porque o número
 * é lido de relance numa tela clínica; a magnitude exata continua disponível
 * em `data-idade-ms` para teste e para telemetria.
 */
export function textoIdadeDecorrida(idadeMs: number): string {
  const segundosTotais = Math.max(0, Math.floor(idadeMs / 1000));
  if (segundosTotais < 60) return `${segundosTotais} s`;

  const minutosTotais = Math.floor(segundosTotais / 60);
  if (minutosTotais < 60) {
    const segundos = segundosTotais % 60;
    return segundos === 0 ? `${minutosTotais} min` : `${minutosTotais} min ${segundos} s`;
  }

  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
}

/**
 * Situação de prontidão do serviço (`GET /v1/readyz`). Os identificadores são
 * do BACKEND (`VereditoProntidao` do contrato) — ADR-0021 F1: identificador do
 * backend, texto do frontend. `nao_lida` é o caso em que o frontend não
 * conseguiu obter veredito algum, e é fail-closed: nunca é redigido como
 * "provavelmente tudo bem".
 *
 * As RAZÕES não são traduzidas aqui, de propósito. Elas são vocabulário
 * fechado (`CodigoRazaoProntidao`) e o contrato já obriga o servidor a enviar,
 * em `detalhe`, o texto pt-BR de operação correspondente. Redigir uma segunda
 * versão dessas frases no frontend criaria duas descrições divergentes do
 * mesmo fato (ADR-0008 N3: as razões são do backend).
 *
 * VALIDATION REQUIRED (ADR-0029 C2 ABERTA) — redação provisória de engenharia.
 * Nenhuma destas frases afirma estado clínico: elas descrevem o serviço.
 */
export type SituacaoProntidao = "ready" | "degraded" | "not_ready" | "nao_lida";

export function textoProntidao(situacao: SituacaoProntidao): TextoComTom {
  switch (situacao) {
    case "ready":
      return { texto: "Serviço declarou capacidade segura.", tom: "positivo" };
    case "degraded":
      return {
        texto:
          "Serviço declarou capacidade DEGRADADA. Esta tela é consultiva e pode não refletir " +
          "o estado atual; use o procedimento institucional de vigilância.",
        tom: "atencao",
      };
    case "not_ready":
      return {
        texto:
          "Serviço declarou NÃO ter capacidade clínica segura. Esta tela é consultiva e pode " +
          "não refletir o estado atual; use o procedimento institucional de vigilância.",
        tom: "alerta",
      };
    case "nao_lida":
      return {
        texto:
          "Não foi possível ler a declaração de prontidão do serviço — não há como afirmar " +
          "que ele está apto. Trate esta tela como não confirmada.",
        tom: "inconclusivo",
      };
    default:
      return casoImpossivel(situacao, "textoProntidao");
  }
}

/** Rótulo textual (nunca só cor) para a banda de risco — nome + tom. */
export function textoBandaRisco(banda: BandaRisco): TextoComTom {
  switch (banda) {
    case "baixo":
      return { texto: "Risco baixo", tom: "positivo" };
    case "medio":
      return { texto: "Risco médio", tom: "atencao" };
    case "alto":
      return { texto: "Risco alto", tom: "alerta" };
    case "critico":
      return { texto: "Risco crítico", tom: "critico" };
    default:
      return casoImpossivel(banda, "textoBandaRisco");
  }
}

/**
 * Glifo curto não-dependente de cor, mostrado ao lado do texto de tom
 * (prompt §11 "non-color cues"). Deliberadamente distinto entre
 * `inconclusivo` (interrogação) e `neutro`/`positivo` — nunca o mesmo
 * símbolo de "ok" para um estado fail-closed (ADR-0029 P1).
 */
export function glifoTom(tom: Tom): string {
  switch (tom) {
    case "neutro":
      return "•";
    case "positivo":
      return "✓";
    case "informativo":
      return "i";
    case "atencao":
      return "!";
    case "alerta":
      return "▲";
    case "critico":
      return "▲▲";
    case "inconclusivo":
      return "?";
    default:
      return casoImpossivel(tom, "glifoTom");
  }
}
