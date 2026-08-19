import { useEffect, useMemo, useState } from "react";
import { criarLeitorDeProntidaoHttp, type LeitorDeProntidao } from "./api/prontidao.js";
import type { ProvedorSessao } from "./api/sessao.js";
import type { ClienteApiIntensiCare } from "./api/tipos.js";
import { AnuncioDeTela } from "./components/AnuncioDeTela.js";
import { AvisoSessao } from "./components/AvisosDeEstado.js";
import { BannerContexto } from "./components/BannerContexto.js";
import { DetalhePaciente } from "./components/DetalhePaciente.js";
import { GaleriaEstados } from "./components/GaleriaEstados.js";
import { GradeLeitos } from "./components/GradeLeitos.js";
import { ID_CONTEUDO_PRINCIPAL, LinkPular } from "./components/LinkPular.js";
import { TelaEnderecoNaoReconhecido } from "./components/TelaEnderecoNaoReconhecido.js";
import type { EstadoSessao } from "./domain/estados.js";
import { useReconciliacaoObservada } from "./estado/reconciliacaoObservada.js";
import type { Relogio } from "./estado/relogio.js";
import {
  criarAbridorDeFluxoNavegador,
  criarEmissorDeTicketNavegador,
} from "./eventos/adaptadorNavegador.js";
import type { AbrirFluxo, EmitirTicket } from "./eventos/porta.js";
import { useFluxoDeEventos } from "./eventos/useFluxoDeEventos.js";
import { ehPerfilDesenvolvimento, pedeGaleriaDeEstados } from "./perfil.js";
import { useFocoNaTransicaoDeTela } from "./roteamento/foco.js";
import type { PortaHistorico } from "./roteamento/historico.js";
import {
  nomeDaTela,
  type TelaCorrente,
  tituloDaTela,
  useTituloDocumento,
} from "./roteamento/tituloDocumento.js";
import { useRoteador } from "./roteamento/useRoteador.js";

/**
 * Casca de navegação desta fatia (SPR-G7-2).
 *
 * MUDANÇA DO LAC-L4. A navegação deixou de ser um `useState<string|null>` e
 * passou a ser derivada da URL (`roteamento/`): existe endereço por leito, deep
 * link, recarregamento que preserva contexto e histórico do navegador de fato —
 * o "voltar" volta para a grade em vez de SAIR da aplicação. Sem biblioteca de
 * rotas: nenhuma está instalada nesta fatia e acrescentar dependência de runtime
 * a superfície clínica é decisão de cadeia de suprimentos (ADR-0022), não desta
 * camada. A History API nativa basta para duas telas.
 *
 * O PERIGO QUE ESSA MUDANÇA CRIA, E ONDE ELE FOI FECHADO. Navegar direto de um
 * leito para outro NÃO desmonta `DetalhePaciente` — e `useRecursoRemoto`
 * preserva o dado anterior numa recarga que falha (invariante I2). Sem guarda
 * de identidade, a tela mostraria o paciente anterior sob o cabeçalho do leito
 * novo: atribuição errada, o dano-raiz de HAZ-0001/HAZ-0002. A guarda existia
 * para o conteúdo e foi estendida aos RÓTULOS (frescor e idade da visão) em
 * `DetalhePaciente.tsx`, com teste dedicado em
 * `components/atribuicaoEntreLeitos.test.tsx`.
 *
 * MUDANÇA DO ACH-07 (preservada). `App` não CRIA o cliente: ele o RECEBE. A
 * criação (que decide perfil, `?mock` e sessão) vive em `api/resolverCliente.ts`
 * e roda em `main.tsx` ANTES de montar a árvore, de modo que a recusa em perfil
 * não-dev seja uma exceção observável e não um `if` silencioso dentro de um
 * render.
 *
 * Rastreio: LAC-L4, ACH-07, ADR-0021, HAZ-0046, WCAG 2.2 SC 2.4.1/2.4.2.
 */
interface AppProps {
  cliente: ClienteApiIntensiCare;
  sessao: ProvedorSessao;
  /** `window.location.search`; injetável em teste. */
  busca?: string;
  /**
   * Leitor de prontidão (`GET /v1/readyz`). Injetável em teste; no caminho
   * real a casca cria o leitor HTTP. Ele é criado AQUI, e não em
   * `resolverCliente`, porque a superfície é ANÔNIMA por contrato
   * (`security: []`) e não depende da sessão — é justamente quando a sessão
   * falha que a tela mais precisa poder declarar a situação do serviço.
   *
   * TRÊS VALORES DISTINTOS, como já era em `GradeLeitos`/`DetalhePaciente`:
   * ausente = a casca cria o leitor HTTP real; um leitor = usa aquele;
   * `null` = esta montagem NÃO observa prontidão e, portanto, não afirma nada
   * sobre ela. Antes, `null` era indistinguível de ausente (`?? leitorPadrao`)
   * e um teste que quisesse dizer "não observo prontidão" recebia o leitor HTTP
   * assim mesmo.
   */
  leitorProntidao?: LeitorDeProntidao | null;
  /**
   * Porta de histórico (`roteamento/historico.ts`). Injetável em teste pela
   * mesma razão do relógio: o comportamento do botão "voltar" é do NAVEGADOR, e
   * um teste que tenta dirigir o navegador de dentro do jsdom mede o agendador
   * do jsdom, não o produto. O "voltar" real é verificado em `e2e/navegacao.spec.ts`.
   */
  historico?: PortaHistorico;
  /**
   * Portas do transporte de push (`eventos/`). Ausente = a casca cria os
   * adaptadores reais (`EventSource` + `fetch`). `null` = esta montagem NÃO
   * consome push — é o valor usado por toda suíte que não está exercitando o
   * fluxo, porque abrir `EventSource` no jsdom não é possível e um teste que
   * abrisse socket de verdade não seria um teste de componente.
   */
  portasDeEventos?: PortasDeEventos | null;
}

/** Injeção do transporte de push, para teste e para a casca real. */
export interface PortasDeEventos {
  readonly abrirFluxo: AbrirFluxo;
  readonly emitirTicket: EmitirTicket;
  /** Porta de tempo do fluxo (vigia de silêncio, reconexão). */
  readonly relogio?: Relogio;
  /** Fonte de aleatoriedade do jitter de reconexão. */
  readonly sortear?: () => number;
}

export function App({
  cliente,
  sessao,
  busca = "",
  leitorProntidao,
  historico,
  portasDeEventos,
}: AppProps) {
  const roteador = useRoteador(historico);
  const [estadoSessao, setEstadoSessao] = useState<EstadoSessao>(() => sessao.estadoAtual());
  // Estável entre renderizações: um leitor recriado a cada render entraria na
  // lista de dependências do efeito de busca e provocaria um laço.
  const leitorPadrao = useMemo(() => criarLeitorDeProntidaoHttp(), []);
  const leitor = leitorProntidao === undefined ? leitorPadrao : leitorProntidao;
  const refPrincipal = useFocoNaTransicaoDeTela<HTMLElement>(roteador.navegacoes);

  // O estado de sessão é ORIGINADO no provedor (S3) — a tela assina, nunca
  // deduz expiração contando tempo por conta própria.
  useEffect(() => {
    setEstadoSessao(sessao.estadoAtual());
    return sessao.assinar(setEstadoSessao);
  }, [sessao]);

  /*
    A CONDIÇÃO DA GALERIA APARECE DUAS VEZES, DE PROPÓSITO — e a duplicação é a
    própria proteção. `import.meta.env.DEV` é substituído por um LITERAL pelo
    Vite; ele precisa estar dentro do `if` que contém o JSX de `GaleriaEstados`
    para que o empacotador consiga provar o ramo inalcançável e remover o módulo
    do pacote de produção. Numa variável intermediária (`if (ehGaleria)`) a
    eliminação passa a depender de propagação de constante do empacotador — que
    é otimização, não garantia. Isso já vazou uma vez com `ControleDemonstracao`
    e foi pego pela guarda de bundle (`build/guardaArtefatoSintetico.ts`).
    A cópia abaixo serve apenas ao TÍTULO, e não referencia o módulo.
  */
  const ehGaleria = import.meta.env.DEV && ehPerfilDesenvolvimento() && pedeGaleriaDeEstados(busca);

  /*
    UMA ÚNICA CONEXÃO POR ABA, e é por isso que o hook vive AQUI.

    O navegador limita conexões SSE por origem, e o ticket do handshake é de USO
    ÚNICO (`apps/api/src/eventos/ticket.ts`): duas telas montando
    `useFluxoDeEventos` abririam dois fluxos e queimariam dois tickets, e a
    segunda abertura poderia simplesmente não acontecer. As telas recebem PROPS
    — nunca o hook. Navegar entre grade e detalhe não fecha nem reabre nada,
    porque a casca não desmonta.
  */
  const portasPadrao = useMemo<PortasDeEventos>(
    () => ({
      abrirFluxo: criarAbridorDeFluxoNavegador(),
      // A CREDENCIAL DA SESSÃO ATRAVESSA O HANDSHAKE. Sem isto o `POST
      // /v1/eventos/ticket` sai anônimo (a sessão desta fatia é um bearer em
      // memória, não um cookie), o servidor responde 401 e o push para com
      // `ticket-recusado` — sempre explicando o motivo, nunca funcionando.
      // OBSERVADO pela suíte E2E ao fiar o transporte; ver a nota em
      // `eventos/adaptadorNavegador.ts`.
      emitirTicket: criarEmissorDeTicketNavegador({
        autorizacao: (sinal) => sessao.cabecalhoAutorizacao(sinal),
      }),
    }),
    [sessao],
  );
  const portas: PortasDeEventos = portasDeEventos ?? portasPadrao;

  /**
   * RELEITURA PEDIDA PELA MÁQUINA — e a EVIDÊNCIA de que ela aconteceu.
   *
   * ESTE PARÁGRAFO DIZIA O CONTRÁRIO, E ESTAVA ERRADO (ACH-O3-9). Ele explicava
   * que o callback deliberadamente NÃO esperava a releitura terminar, e tratava
   * isso como custo de requisição. Não era: `useFluxoDeEventos` aguarda o que a
   * porta devolve, e um `void` faz `await undefined` resolver na microtarefa
   * seguinte. A máquina dava a reconciliação por concluída ANTES de qualquer
   * requisição sair, e a tela anunciava "Sincronizado — dados reconciliados após
   * reconexão." no instante em que o cliente SABE ter perdido um evento
   * (HAZ-0025; SAF-0025 exige que a interface NUNCA pareça saudável quando não
   * está). Era veracidade, não desempenho.
   *
   * A terceira prop de callback atravessando a árvore, que aquele texto queria
   * evitar, é exatamente o que faltava: `aoRelatarLeitura`. Ela custa uma prop e
   * paga com a única coisa que autoriza dizer `reconciliado` — um fato de
   * leitura (`estado/reconciliacaoObservada.ts`).
   *
   * UM CONTADOR SÓ DESCE, E ISSO TAMBÉM MUDOU. Antes a tela recebia
   * `eventos.sinalDeReleitura + pedidosDeReconciliacao`. Os dois se sobrepõem, e
   * a soma tinha um efeito não intencional: durante o catch-up (`replaying`) a
   * máquina SUPRIME de propósito a releitura por evento — ela sai uma única vez
   * quando o servidor declara `online` —, mas o contador de eventos avançava
   * assim mesmo e a tela relia uma vez por evento, refazendo a tempestade que a
   * máquina evita. Agora desce só o contador de PEDIDOS, que é o que a máquina
   * de fato decidiu; `eventos.sinalDeReleitura` permanece como observabilidade.
   */
  const reconciliacao = useReconciliacaoObservada();

  /*
    O push é DESLIGADO onde não pode ou não deve existir:
      - `portasDeEventos === null`: montagem que declara não consumir push;
      - sessão expirada: pedir ticket com credencial expirada é bater em 401, e
        esta tela já não renderiza dado de paciente (IA-N12);
      - galeria de revisão de UI: superfície de desenvolvimento, sem tela clínica.
  */
  const pushHabilitado = portasDeEventos !== null && estadoSessao !== "expirada" && !ehGaleria;

  const eventos = useFluxoDeEventos({
    abrirFluxo: portas.abrirFluxo,
    emitirTicket: portas.emitirTicket,
    reconciliar: reconciliacao.pedirReleitura,
    habilitado: pushHabilitado,
    ...(portas.relogio !== undefined ? { relogio: portas.relogio } : {}),
    ...(portas.sortear !== undefined ? { sortear: portas.sortear } : {}),
  });

  // A tela reage à MUDANÇA do número, não à sua magnitude.
  const sinalDeReleitura = reconciliacao.sinal;

  const tela: TelaCorrente = ehGaleria
    ? "galeria"
    : estadoSessao === "expirada"
      ? "sessao_expirada"
      : roteador.rota.tipo;

  // WCAG 2.4.2 — título distinto e significativo por tela.
  useTituloDocumento(tituloDaTela(tela, roteador.rota));

  /*
    O anúncio só existe APÓS uma navegação. Na primeira pintura (deep link,
    recarregamento) quem anuncia a tela é o `document.title`, que o leitor de
    tela lê ao carregar a página; encher a live region ali produziria anúncio
    duplicado do mesmo fato.
  */
  const anuncioDeTela = roteador.navegacoes === 0 ? null : nomeDaTela(tela, roteador.rota);

  function moverFocoParaConteudo(): void {
    refPrincipal.current?.focus({ preventScroll: true });
  }

  // Galeria de estados: superfície de revisão de UI que renderiza TODOS os
  // identificadores obrigatórios do §11. Só existe em desenvolvimento — ver a
  // nota sobre a condição duplicada acima.
  if (import.meta.env.DEV && ehPerfilDesenvolvimento() && pedeGaleriaDeEstados(busca)) {
    return (
      <div lang="pt-BR">
        <LinkPular aoPular={moverFocoParaConteudo} />
        <BannerContexto />
        <AnuncioDeTela mensagem={anuncioDeTela} />
        <main id={ID_CONTEUDO_PRINCIPAL} ref={refPrincipal} tabIndex={-1}>
          <GaleriaEstados />
        </main>
      </div>
    );
  }

  /**
   * Sessão expirada bloqueia a tela clínica e o dado de paciente deixa de
   * ser renderizado (modelo de estados §4: "limpa dado de paciente do estado
   * de cliente"; IA-N12). O banner de contexto permanece — ele nunca é
   * removido condicionalmente (HAZ-0046).
   *
   * ESTA GUARDA VEM ANTES DA ROTA, e isso passou a importar com o deep link:
   * abrir `/leitos/SYNTH-LEITO-01` direto, com a sessão expirada, NÃO pode
   * montar `DetalhePaciente`. A rota permanece na barra de endereço (não há
   * redirecionamento silencioso), mas nenhuma tela clínica é construída e
   * nenhuma requisição de paciente é emitida.
   */
  if (estadoSessao === "expirada") {
    return (
      <div lang="pt-BR">
        <LinkPular aoPular={moverFocoParaConteudo} />
        <BannerContexto />
        <AnuncioDeTela mensagem={anuncioDeTela} />
        <main id={ID_CONTEUDO_PRINCIPAL} ref={refPrincipal} tabIndex={-1}>
          <h1>IntensiCare V2 — Grade de leitos (fatia sintética)</h1>
          <AvisoSessao estado="expirada" />
          <p>
            Nenhum dado de paciente é exibido enquanto a sessão estiver expirada. Reautentique para
            continuar.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div lang="pt-BR">
      <LinkPular aoPular={moverFocoParaConteudo} />
      <BannerContexto />
      <AnuncioDeTela mensagem={anuncioDeTela} />
      <main id={ID_CONTEUDO_PRINCIPAL} ref={refPrincipal} tabIndex={-1}>
        <h1>IntensiCare V2 — Grade de leitos (fatia sintética)</h1>
        <AvisoSessao estado={estadoSessao} />
        {roteador.rota.tipo === "detalhe" && (
          <DetalhePaciente
            leitoId={roteador.rota.leitoId}
            cliente={cliente}
            aoVoltar={roteador.irParaGrade}
            leitorProntidao={leitor}
            sinalDeReleitura={sinalDeReleitura}
            aoRelatarLeitura={reconciliacao.relatarLeitura}
            degradadoPeloPush={eventos.degradado}
            conectividadeDoPush={eventos.conectividade}
          />
        )}
        {roteador.rota.tipo === "grade" && (
          <GradeLeitos
            cliente={cliente}
            aoSelecionarLeito={roteador.irParaLeito}
            leitorProntidao={leitor}
            sinalDeReleitura={sinalDeReleitura}
            aoRelatarLeitura={reconciliacao.relatarLeitura}
            degradadoPeloPush={eventos.degradado}
            conectividadeDoPush={eventos.conectividade}
          />
        )}
        {roteador.rota.tipo === "desconhecida" && (
          <TelaEnderecoNaoReconhecido
            caminho={roteador.rota.caminho}
            aoIrParaGrade={roteador.irParaGrade}
          />
        )}
      </main>
    </div>
  );
}
