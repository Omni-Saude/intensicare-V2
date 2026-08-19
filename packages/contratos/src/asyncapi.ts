/**
 * @intensicare/contratos — contrato do canal de eventos em tempo real.
 *
 * Este módulo é a fonte única, em TypeScript, do vocabulário que o
 * documento `../asyncapi.yaml` descreve: nomes de evento SSE, estados de
 * conexão, motivos de encerramento e formato das mensagens de plano de
 * controle. O gate `scripts/check_contratos.mjs` compara os três lados —
 * este módulo, o `asyncapi.yaml` e o catálogo em prosa
 * `docs/09-api-events-and-mcp/catalogo-de-eventos.md` — e FALHA quando
 * divergem.
 *
 * Rastreio: ADR-0011 (P2/P3/P4/P5/P6/P8, aceito GDEC-0008, Opção A),
 * ADR-0016 §4.1 (chave escopada por tipo; reavaliação de autorização por
 * evento), ADR-0010 B3/B8 (ordenação e envelope de evento).
 *
 * Como o resto do pacote, este módulo NÃO tem dependência de runtime — só
 * tipos e constantes (PRE-11). Nenhuma alegação de efetividade clínica,
 * conformidade regulatória ou segurança comprovada é feita aqui.
 */

// ---------------------------------------------------------------------------
// Identificação do documento AsyncAPI
// ---------------------------------------------------------------------------

/** Caminho do documento AsyncAPI, relativo à raiz do pacote. */
export const ASYNCAPI_DOC_PATH = "asyncapi.yaml" as const;

/** Versão da especificação AsyncAPI usada pelo documento. */
export const ASYNCAPI_SPEC_VERSION = "3.0.0" as const;

/**
 * Versão do CONTRATO de canal (não do serviço). Evolui conforme a política
 * declarada em `POLITICA_EVOLUCAO_EVENTOS`.
 */
export const ASYNCAPI_CONTRACT_VERSION = "0.1.0" as const;

// ---------------------------------------------------------------------------
// Rotas do canal
// ---------------------------------------------------------------------------

/**
 * Rotas do gateway de eventos, PUBLICADAS pelo contrato.
 *
 * POR QUE ELAS VIVEM AQUI, e não só em quem as registra. A fronteira de módulo
 * (`scripts/check_module_boundaries.mjs`, ADR-0002) permite `apps/web ->
 * SOMENTE contratos`: o frontend não pode importar
 * `apps/api/src/eventos/stream.ts`, que era onde as rotas estavam declaradas.
 * Enquanto foi assim, todo consumidor de navegador foi OBRIGADO a redigitar a
 * rota — e rota redigitada deriva em silêncio, que é a classe de defeito que
 * este pacote existe para eliminar.
 *
 * `packages/contratos/src/asyncapi.test.ts` prova que `CAMINHO_FLUXO_EVENTOS`
 * é EXATAMENTE o `address` do canal no `asyncapi.yaml` e que os dois caminhos
 * são rotas declaradas no `openapi.yaml`. Nenhum deles carrega query string:
 * credencial, tenant e identificador de sujeito não trafegam ali (prompt §10
 * anti-padrão 12).
 */
export const CAMINHO_TICKET_EVENTOS = "/v1/eventos/ticket" as const;
export const CAMINHO_FLUXO_EVENTOS = "/v1/eventos/stream" as const;

// ---------------------------------------------------------------------------
// Plano de dados — tipos de evento do fluxo
// ---------------------------------------------------------------------------

/**
 * Enum fechado dos tipos de evento que o fluxo entrega, na ordem em que o
 * catálogo os documenta. FONTE ÚNICA: `EventoFluxo["tipo"]` (em
 * `./index.ts`) deriva desta tupla, o `asyncapi.yaml` a repete e o gate
 * `check_contratos.mjs` prova a igualdade dos três com o catálogo.
 *
 * OBSERVADO: são exatamente os cinco valores produzidos hoje pelo mapa
 * `OUTBOX_TO_CONTRACT_EVENT` de `apps/api/src/db.ts`. Nomes de evento de
 * `WorkItem` além destes permanecem em aberto (catálogo §2.3) — este
 * contrato NÃO os inventa.
 */
export const TIPOS_EVENTO_FLUXO = [
  "observacoes-ingeridas",
  "observacao-clinica-registrada",
  "avaliacao-computada",
  "alerta-criado",
  "alerta-atualizado",
] as const;

export type TipoEventoFluxo = (typeof TIPOS_EVENTO_FLUXO)[number];

/**
 * Política de evolução do contrato de eventos (ADR-0012 segue
 * `not-started`; esta é a leitura desta fatia das convenções já aceitas,
 * não a decisão daquele ADR).
 *
 * PREMISSA (reversível, GDEC-0015/0017): campo novo opcional e valor novo
 * de enum de plano de CONTROLE são mudanças compatíveis; consumidor ignora
 * o que não conhece. Remover campo, renomear campo, estreitar tipo ou
 * acrescentar valor ao enum de plano de DADOS (`TIPOS_EVENTO_FLUXO`) é
 * quebra — exige nova versão de contrato e período de convivência.
 */
export const POLITICA_EVOLUCAO_EVENTOS = {
  compativel: [
    "acrescentar campo opcional a uma mensagem",
    "acrescentar valor a enum de plano de controle (motivo, estado de conexão)",
    "acrescentar canal ou operação nova",
  ],
  quebra: [
    "remover ou renomear campo",
    "estreitar tipo ou tornar campo obrigatório",
    "acrescentar valor a TIPOS_EVENTO_FLUXO (o consumidor filtra por tipo)",
    "mudar a semântica de `sequencia` (cursor de retomada)",
  ],
  regraConsumidor:
    "O consumidor IGNORA silenciosamente campos que não conhece e NUNCA silencia um `event:` desconhecido: registra-o como lacuna observável e reconcilia por polling (ADR-0011 P4/P8).",
} as const;

// ---------------------------------------------------------------------------
// Nomes de evento SSE (campo `event:` do quadro)
// ---------------------------------------------------------------------------

/**
 * Nome do evento SSE do plano de controle que sinaliza vivacidade da
 * conexão (ADR-0011 P5/P6: a ausência de heartbeat é a evidência de que a
 * conexão morreu — jamais uma grade parada com aparência de saudável).
 */
export const EVENTO_SSE_PULSACAO = "pulsacao" as const;

/** Nome do evento SSE que transporta o estado de conexão (ADR-0011 P6). */
export const EVENTO_SSE_ESTADO_CONEXAO = "estado-conexao" as const;

/**
 * Nome do evento SSE que instrui reconciliação por polling e precede
 * SEMPRE um encerramento explícito (ADR-0011 P4/P5) — a lacuna nunca é
 * silenciosa.
 */
export const EVENTO_SSE_INSTRUCAO_RECONCILIACAO = "instrucao-reconciliacao" as const;

/** Todos os nomes de evento SSE do plano de controle. */
export const EVENTOS_SSE_CONTROLE = [
  EVENTO_SSE_PULSACAO,
  EVENTO_SSE_ESTADO_CONEXAO,
  EVENTO_SSE_INSTRUCAO_RECONCILIACAO,
] as const;

export type EventoSseControle = (typeof EVENTOS_SSE_CONTROLE)[number];

// ---------------------------------------------------------------------------
// Estados de conexão (ADR-0011 P6, verbatim)
// ---------------------------------------------------------------------------

/**
 * Estados de conexão que o contrato de projeção precisa exibir (ADR-0011
 * P6, que os nomeia verbatim a partir do prompt §11: *online, degraded,
 * offline, reconnecting, replaying, reconciled*).
 *
 * NOTA DE IDIOMA: os seis TOKENS DE FIO permanecem nas palavras exatas da
 * cláusula aceita — renomeá-los para pt-BR criaria uma taxonomia
 * divergente da ADR, que é o que a regra de rastreabilidade proíbe. Toda
 * descrição, rótulo de UI e mensagem de erro derivada deles é em pt-BR
 * (ver `DESCRICAO_ESTADO_CONEXAO`).
 */
export const ESTADOS_CONEXAO = [
  "online",
  "degraded",
  "offline",
  "reconnecting",
  "replaying",
  "reconciled",
] as const;

export type EstadoConexao = (typeof ESTADOS_CONEXAO)[number];

/** Descrição pt-BR de cada estado de conexão, para exibição e log. */
export const DESCRICAO_ESTADO_CONEXAO: Readonly<Record<EstadoConexao, string>> = {
  online: "Conexão aberta e em dia com o cursor do servidor.",
  degraded:
    "Conexão aberta, porém com entrega atrasada ou parcial — o dado exibido pode estar atrás do servidor.",
  offline: "Sem conexão de push; a superfície depende de reconciliação por polling.",
  reconnecting: "Reconexão em andamento, com retomada a partir do cursor durável.",
  replaying: "Entregando o backlog acumulado desde o cursor informado (catch-up).",
  reconciled:
    "Reconciliação por polling concluída; o cliente está alinhado à projeção autoritativa.",
};

// ---------------------------------------------------------------------------
// Motivos de encerramento / instrução de reconciliação
// ---------------------------------------------------------------------------

/**
 * Motivos pelos quais o servidor encerra explicitamente a assinatura.
 * Cada um é uma cláusula aceita, não uma invenção:
 * - `cursor-irretomavel` — ADR-0011 P4 (lacuna explícita, jamais pulada);
 * - `fila-excedida` — ADR-0011 P5 (shed honesto por desconexão, nunca
 *   descarte silencioso com conexão de aparência saudável);
 * - `autorizacao-revogada`, `sessao-expirada`, `contexto-alterado` —
 *   ADR-0011 P3 e ADR-0016 §4.1 (reavaliação por evento);
 * - `escopo-divergente` — ADR-0011 P2 / ADR-0016 §4.1 (fail-closed quando
 *   o tenant do envelope não bate com a chave escopada da assinatura);
 * - `desligamento-servidor` — encerramento operacional (ADR-0011 §8.3
 *   iii: conexões derrubáveis em massa COM instrução de reconciliação);
 * - `falha-interna` — o servidor não conseguiu sustentar a assinatura
 *   (falha na leitura do backbone durável, na revalidação de sessão ou na
 *   autorização de entrega). Existe porque a alternativa era pior: sem um
 *   motivo honesto, uma falha assíncrona vira socket que morre calado, ou
 *   pior, pulsação `online` enquanto o servidor já não está em dia —
 *   ADR-0011 P6/P10 e prompt §20 proíbem os dois. O cliente recebe
 *   instrução de reconciliar; NENHUM detalhe do erro viaja no fio.
 */
export const MOTIVOS_ENCERRAMENTO = [
  "cursor-irretomavel",
  "fila-excedida",
  "autorizacao-revogada",
  "sessao-expirada",
  "contexto-alterado",
  "escopo-divergente",
  "desligamento-servidor",
  "falha-interna",
] as const;

export type MotivoEncerramento = (typeof MOTIVOS_ENCERRAMENTO)[number];

/** Descrição pt-BR de cada motivo — texto que o cliente pode exibir. */
export const DESCRICAO_MOTIVO_ENCERRAMENTO: Readonly<Record<MotivoEncerramento, string>> = {
  "cursor-irretomavel":
    "O cursor informado é anterior ao ponto mais antigo que o servidor consegue retomar. Há uma lacuna: reconcilie por polling antes de confiar na tela.",
  "fila-excedida":
    "A fila desta conexão excedeu o limite declarado. A conexão foi encerrada de propósito — nenhum evento foi descartado em silêncio; reconcilie por polling.",
  "autorizacao-revogada":
    "A autorização deixou de valer durante a entrega. A assinatura foi encerrada pelo servidor.",
  "sessao-expirada":
    "A sessão expirou durante a entrega. A assinatura foi encerrada pelo servidor.",
  "contexto-alterado":
    "O contexto verificado da sessão mudou durante a entrega. A assinatura foi encerrada pelo servidor.",
  "escopo-divergente":
    "Um evento com escopo de tenant divergente da assinatura foi detectado. A assinatura foi encerrada de imediato (fail-closed).",
  "desligamento-servidor":
    "O servidor está encerrando as conexões de push. Reconcilie por polling e reconecte conforme a política informada.",
  "falha-interna":
    "O servidor não conseguiu sustentar esta assinatura e a encerrou de propósito. O que está na tela pode estar desatualizado: reconcilie por polling antes de confiar nela.",
};

/**
 * Ação que o cliente DEVE tomar. `reconciliar-por-polling` é o caminho de
 * verdade de recuperação (ADR-0011 P8): o push é otimização de latência
 * sobre ele, nunca o contrário.
 */
export const ACOES_RECONCILIACAO = ["reconciliar-por-polling", "reconectar-do-cursor"] as const;

export type AcaoReconciliacao = (typeof ACOES_RECONCILIACAO)[number];

// ---------------------------------------------------------------------------
// Mensagens do plano de controle
// ---------------------------------------------------------------------------

/**
 * Política de reconexão dirigida pelo servidor (ADR-0011 P5: "tempestade
 * de reconexão é mitigada por política declarada — backoff/jitter
 * server-driven"). Os NÚMEROS não são decididos aqui: viajam no fio porque
 * quem os escolhe é a configuração do servidor, e permanecem
 * `VALIDATION REQUIRED` até medição (ADR-0011 §3 D6).
 */
export interface PoliticaReconexao {
  /** Espera mínima antes de reconectar, em milissegundos. */
  esperaMinimaMs: number;
  /** Teto da espera, em milissegundos. */
  esperaMaximaMs: number;
  /** Fração de jitter aleatório aplicada sobre a espera (0..1). */
  jitter: number;
}

/**
 * Intervalo de pulsação anunciado no fio, em milissegundos.
 *
 * POR QUE ESTE CAMPO EXISTE (lacuna medida, não melhoria especulativa). Este
 * contrato afirma que "a AUSÊNCIA de pulsação dentro do intervalo anunciado é
 * o sinal de que a conexão morreu" — e, até esta versão, NENHUM campo carregava
 * o intervalo: ele só existia em `LimitesConexao`
 * (`apps/api/src/eventos/fila.ts`), do lado do servidor. A consequência era de
 * segurança clínica, não de estética: entre a abertura e a PRIMEIRA pulsação o
 * cliente não tinha referência alguma para armar vigia, e uma conexão
 * meio-aberta nessa janela ficava indistinguível de uma saudável (HAZ-0025;
 * SAF-0025; ADR-0011 P6).
 *
 * OPCIONAL de propósito: acrescentar campo opcional é evolução COMPATÍVEL
 * (`POLITICA_EVOLUCAO_EVENTOS.compativel`); torná-lo obrigatório seria QUEBRA.
 * Um consumidor que não o receba continua conforme — e continua obrigado a
 * degradar a tela quando a pulsação faltar, aprendendo a cadência do próprio
 * fio.
 *
 * O NÚMERO NÃO É DECIDIDO POR ESTE CONTRATO. Ele é configuração do servidor e
 * permanece `VALIDATION REQUIRED` (ADR-0011 §3 D6). Não é SLO, não é alvo de
 * latência de entrega e não é limiar clínico de frescor (VAL-0023).
 */

/** Mensagem de pulsação (`event: pulsacao`). Nunca carrega dado clínico. */
export interface MensagemPulsacao {
  /** Instante do servidor, ISO 8601. */
  emitidoEm: string;
  /** Estado de conexão vigente no momento da pulsação (ADR-0011 P6). */
  estado: EstadoConexao;
  /** Último cursor efetivamente entregue nesta conexão. */
  cursor: number;
  /** Eventos aguardando escrita nesta conexão (visibilidade de backlog). */
  pendentes: number;
  /** Cadência de pulsação anunciada pelo servidor — ver nota acima. */
  intervaloPulsacaoMs?: number;
}

/**
 * Mensagem de estado de conexão (`event: estado-conexao`).
 *
 * É o PRIMEIRO quadro da assinatura (`replaying`, na abertura), e por isso o
 * lugar certo para os dois anúncios: quando ele chega, o cliente já sabe com
 * que cadência esperar pulsação e com que política reconectar — antes de
 * qualquer pulsação e antes de qualquer encerramento.
 */
export interface MensagemEstadoConexao {
  estado: EstadoConexao;
  /** Descrição pt-BR do estado — pronta para exibição. */
  descricao: string;
  emitidoEm: string;
  cursor: number;
  /** Cadência de pulsação anunciada pelo servidor — ver nota acima. */
  intervaloPulsacaoMs?: number;
  /**
   * Política de reconexão DIRIGIDA PELO SERVIDOR (ADR-0011 P5), anunciada já
   * na abertura.
   *
   * POR QUE ELA PRECISOU SUBIR PARA CÁ. Até esta versão a política só viajava
   * dentro de `MensagemInstrucaoReconciliacao`, isto é, no ENCERRAMENTO. Uma
   * queda de transporte antes da primeira instrução deixava o cliente sem
   * política alguma — e um cliente conforme não inventa backoff próprio, então
   * o push simplesmente parava. Anunciando na abertura, a reconexão passa a ser
   * possível desde a primeira queda, e continua dirigida pelo servidor.
   *
   * É a MESMA estrutura da instrução, de propósito: um segundo tipo paralelo
   * seria a duplicação que este pacote existe para eliminar.
   */
  reconexao?: PoliticaReconexao;
}

/**
 * Mensagem de instrução de reconciliação (`event: instrucao-reconciliacao`).
 * SEMPRE precede o encerramento da conexão pelo servidor — a lacuna é
 * explícita (ADR-0011 P4/P5; prompt §20: incerteza de entrega jamais
 * oculta).
 */
export interface MensagemInstrucaoReconciliacao {
  motivo: MotivoEncerramento;
  /** Descrição pt-BR do motivo — pronta para exibição. */
  descricao: string;
  acao: AcaoReconciliacao;
  /**
   * Caminho da projeção autoritativa a consultar (ADR-0011 P8). Caminho
   * relativo, sem credencial e sem identificador de sujeito.
   */
  caminhoReconciliacao: string;
  /** Último cursor efetivamente entregue antes do encerramento. */
  cursor: number;
  /**
   * Menor cursor que o servidor ainda consegue retomar (ADR-0011 P4: "o
   * servidor declara até onde o cursor é retomável"). `null` quando o
   * motivo não é de retomada.
   */
  cursorMinimoRetomavel: number | null;
  reconexao: PoliticaReconexao;
  emitidoEm: string;
}

// ---------------------------------------------------------------------------
// Transporte do handshake (ADR-0011 §5.3 — transporte NÃO é vinculado)
// ---------------------------------------------------------------------------

/**
 * Nome do cookie que transporta o ticket efêmero de abertura do fluxo.
 *
 * PREMISSA REVERSÍVEL DECLARADA (ADR-0011 §5.3 — "Não vincula: transporte
 * concreto de push"): o `EventSource` nativo do navegador não envia
 * cabeçalho `Authorization`; a alternativa de pôr credencial na query
 * string é proibida (prompt §10 anti-padrão 12). Adotamos ticket efêmero
 * de USO ÚNICO entregue e lido EXCLUSIVAMENTE por cookie
 * `HttpOnly; Secure; SameSite=Strict` com `Path` estreito — o valor nunca
 * aparece em URL, corpo de resposta, corpo de erro ou log. Reversível: uma
 * decisão futura de sessão/cookie de longa duração (ADR-0015/0016)
 * substitui este mecanismo sem alterar o contrato de mensagens.
 */
export const TICKET_EVENTOS_COOKIE = "ic_ticket_eventos" as const;

/** Cabeçalho padrão de SSE que o navegador reenvia ao reconectar. */
export const LAST_EVENT_ID_HEADER = "Last-Event-ID" as const;

/** Resposta da emissão de ticket — NUNCA contém o valor do ticket. */
export interface TicketEventosResposta {
  /** Instante de expiração do ticket, ISO 8601. */
  expiraEm: string;
  /** Validade em segundos, tal como configurada no servidor. */
  ttlSegundos: number;
  /** Sempre `true` — o ticket é consumido na primeira abertura de fluxo. */
  usoUnico: true;
  /**
   * Onde o ticket foi entregue. Valor fixo `cookie` nesta fatia: serve
   * para o cliente saber que NÃO deve procurar o valor no corpo.
   */
  entregaEm: "cookie";
}

// ---------------------------------------------------------------------------
// Contrato de cliente
// ---------------------------------------------------------------------------

/**
 * Passos que um cliente conforme executa. Declarado como dado (e não só
 * como prosa) para que o frontend e os testes citem a mesma sequência.
 */
export const CONTRATO_CLIENTE_EVENTOS = [
  // Os caminhos vêm das constantes publicadas acima: a rota aparece UMA vez
  // neste módulo, e o teste que confronta contrato × documento a segue.
  `1. POST ${CAMINHO_TICKET_EVENTOS} com a credencial normal — recebe o ticket por cookie HttpOnly (nunca no corpo).`,
  `2. Abrir EventSource em ${CAMINHO_FLUXO_EVENTOS}. Nunca pôr credencial, ticket, tenant ou identificador de sujeito na URL.`,
  "3. Persistir o `id:` de cada evento de dados recebido como cursor durável de retomada.",
  "4. Tratar ausência de `pulsacao` dentro do intervalo anunciado como conexão morta: exibir estado `degraded`/`offline` — jamais manter a tela com aparência de atual.",
  "5. Ao receber `instrucao-reconciliacao`, executar a `acao` indicada ANTES de voltar a confiar na tela; a conexão será encerrada em seguida.",
  "6. Reconectar respeitando a `PoliticaReconexao` recebida (backoff + jitter dirigidos pelo servidor).",
  "7. Qualquer dúvida (lacuna, reconexão, divergência local) resolve-se por polling da projeção autoritativa — o push é otimização de latência, nunca a fonte de verdade.",
] as const;
