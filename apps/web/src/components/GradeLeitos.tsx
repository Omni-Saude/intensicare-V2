import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LeitorDeProntidao } from "../api/prontidao.js";
import type { ClienteApiIntensiCare, ModoDemonstracao } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import type { EstadoConectividade } from "../domain/estados.js";
import {
  combinarConectividade,
  refinarComEstadoDoPush,
  useConectividadeNavegador,
} from "../estado/conectividade.js";
import { useProntidao } from "../estado/prontidao.js";
import { type RelatoDeLeitura, useRelatorioDeLeitura } from "../estado/reconciliacaoObservada.js";
import {
  ehEstadoDeFalha,
  INTERVALO_RECARGA_PADRAO_MS,
  useRecursoRemoto,
} from "../estado/recursoRemoto.js";
import type { Relogio } from "../estado/relogio.js";
import { ehPerfilDesenvolvimento } from "../perfil.js";
import {
  AvisoProntidao,
  IndicadorConectividade,
  RotuloCadenciaRecarga,
  RotuloFrescorVisao,
  RotuloIdadeVisao,
} from "./AvisosDeEstado.js";
import { CartaoLeito } from "./CartaoLeito.js";
import { ControleDemonstracao } from "./ControleDemonstracao.js";
import { EstadoTela } from "./EstadoTela.js";
import { PainelAlertas } from "./PainelAlertas.js";
import { RegiaoAoVivoAlertas } from "./RegiaoAoVivoAlertas.js";

interface GradeLeitosProps {
  cliente: ClienteApiIntensiCare;
  aoSelecionarLeito: (leitoId: string) => void;
  /**
   * Leitor de `GET /v1/readyz`. `null`/ausente = esta montagem NÃO observa
   * prontidão e, portanto, não afirma nada sobre ela (`AvisoProntidao` não
   * renderiza). `App` sempre fornece um leitor real.
   */
  leitorProntidao?: LeitorDeProntidao | null;
  /** Cadência da recarga autoritativa. `null` desliga (usado só em teste). */
  intervaloRecargaMs?: number | null;
  /** Porta de tempo injetável (`../estado/relogio.ts`). */
  relogio?: Relogio;
  /**
   * Fonte de aleatoriedade do JITTER da recarga periódica
   * (`../estado/cadenciaDeRecarga.ts`). Injetável pela mesma razão do relógio:
   * sem ela a espera agendada dependeria de `Math.random` e nenhum teste
   * poderia afirmar quando o próximo ciclo ocorre. `0.5` devolve exatamente o
   * intervalo base.
   */
  sortear?: () => number;
  /**
   * Contador de sinais de releitura vindos do PUSH (`../eventos/`). Quando ele
   * AVANÇA, esta tela relê a projeção autoritativa.
   *
   * É um número, e não um callback, de propósito: o hook de push vive em
   * `App.tsx` (uma conexão por aba) e a tela pode montar depois de vários
   * sinais já terem ocorrido. Comparar com o último valor VISTO por esta
   * montagem torna a releitura idempotente — montar não dispara requisição
   * extra, e um mesmo sinal nunca é consumido duas vezes.
   */
  sinalDeReleitura?: number;
  /**
   * Relata ao pedinte o RESULTADO de cada leitura da projeção
   * (`../estado/reconciliacaoObservada.ts`). Ausente = esta montagem não relata
   * a ninguém.
   *
   * É esta prop que torna verdadeira a afirmação `reconciliado`: sem ela, quem
   * pediu a releitura não tem como saber se ela ocorreu, e o cliente acabava
   * declarando reconciliação com a requisição ainda em voo (ACH-O3-9).
   */
  aoRelatarLeitura?: (relato: RelatoDeLeitura) => void;
  /**
   * QUARTA origem do booleano de degradação (`../eventos/maquina.ts`,
   * `pushDegradaATela`). Aditiva: `false` significa "o push não acusa nada",
   * jamais "a tela está em dia".
   */
  degradadoPeloPush?: boolean;
  /**
   * Estado de conectividade originado no FIO. Só `reproduzindo` e
   * `reconciliado` chegam à tela por aqui, e só quando não há nada mais grave a
   * declarar — ver `refinarComEstadoDoPush`.
   */
  conectividadeDoPush?: EstadoConectividade | null;
}

const ESTADOS_ALERTA_PENDENTE = new Set(["nao_atribuido", "atribuido", "escalado", "reaberto"]);

function alertasPendentes(itens: ItemGradeLeito[]): Alerta[] {
  return itens
    .flatMap((item) => item.alertas)
    .filter((alerta) => ESTADOS_ALERTA_PENDENTE.has(alerta.estado));
}

/**
 * Grade de leitos da UTI — tela inicial desta fatia.
 *
 * ACH-07 substituiu o `cliente.listarGradeLeitos(...).then(...)` sem `.catch`
 * por `useRecursoRemoto`: toda rejeição vira estado de tela, a desmontagem
 * aborta a requisição de fato, e o dado anterior sobrevive a uma falha de
 * recarga SEMPRE rotulado como não-atual.
 */
export function GradeLeitos({
  cliente,
  aoSelecionarLeito,
  leitorProntidao = null,
  intervaloRecargaMs = INTERVALO_RECARGA_PADRAO_MS,
  relogio,
  sortear,
  sinalDeReleitura = 0,
  aoRelatarLeitura,
  degradadoPeloPush = false,
  conectividadeDoPush = null,
}: GradeLeitosProps) {
  const [modoDemo, setModoDemo] = useState<ModoDemonstracao | null>(null);
  const [mensagemAoVivo, setMensagemAoVivo] = useState<string | null>(null);
  const emDesenvolvimento = ehPerfilDesenvolvimento();

  // "Forçar: carregando" é, por definição, um estado terminal desta
  // demonstração — nenhuma chamada é feita e a tela permanece em
  // "Carregando…" até o revisor escolher outro modo. Ferramenta de revisão
  // de UI, disponível apenas em desenvolvimento.
  const demonstrandoCarregando = modoDemo === "carregando";

  const buscar = useCallback(
    (sinal: AbortSignal) =>
      cliente.listarGradeLeitos({
        sinal,
        ...(modoDemo !== null && modoDemo !== "carregando" ? { forcarResultado: modoDemo } : {}),
      }),
    [cliente, modoDemo],
  );

  const recurso = useRecursoRemoto<ItemGradeLeito[]>({
    buscar,
    habilitado: !demonstrandoCarregando,
    intervaloRecargaMs,
    ...(relogio !== undefined ? { relogio } : {}),
    ...(sortear !== undefined ? { sortear } : {}),
  });

  const prontidao = useProntidao({
    leitor: leitorProntidao,
    intervaloRecargaMs,
    ...(relogio !== undefined ? { relogio } : {}),
    ...(sortear !== undefined ? { sortear } : {}),
  });

  const conectividadeNavegador = useConectividadeNavegador();
  const marcarLeituraBemSucedida = conectividadeNavegador.marcarLeituraBemSucedida;
  /*
    Três origens alimentam `degradado`, e nenhuma delas pode ocultar a outra:
    a última leitura falhou (frescor da visão), a releitura automática parou de
    produzir dado novo (idade da visão, LAC-L1), ou o próprio SERVIÇO declarou
    não ter capacidade segura (`/v1/readyz`, LAC-L2). A precedência
    offline > reconectando > degradado > online continua sendo de
    `combinarConectividade`.
  */
  const conectividade = refinarComEstadoDoPush(
    combinarConectividade(
      conectividadeNavegador.estado,
      recurso.exibindoDadoDesatualizado ||
        recurso.idadeVisao?.classe === "ciclo_perdido" ||
        prontidao.degradada ||
        // QUARTA origem: o push se provou vivo e se perdeu, ou o servidor
        // declarou entrega atrasada. Vem DEPOIS das três anteriores e não pode
        // apagar nenhuma — é `||`, não substituição (ADR-0011 P6/P8).
        degradadoPeloPush,
    ),
    conectividadeDoPush,
  );

  /**
   * O SINAL DE RELEITURA VIRA UMA LEITURA DA PROJEÇÃO — e nada mais.
   *
   * O evento nunca traz dado clínico (ADR-0011 P7): ele diz QUE releia. A
   * comparação com o último sinal VISTO por esta montagem é o que impede duas
   * coisas distintas: montar a tela com o contador já adiantado disparando uma
   * requisição espúria, e um mesmo sinal ser consumido duas vezes por um
   * re-render.
   */
  // ROTINA, não nova tentativa do usuário: um sinal de push não pode fazer a
  // grade desmontar e piscar "Tentando novamente…" (invariante I6).
  const reconciliar = recurso.reconciliar;
  const sinalVistoRef = useRef(sinalDeReleitura);
  useEffect(() => {
    if (sinalDeReleitura === sinalVistoRef.current) return;
    sinalVistoRef.current = sinalDeReleitura;
    reconciliar();
  }, [sinalDeReleitura, reconciliar]);

  /*
    O CAMINHO DE VOLTA. Quem pediu a releitura precisa saber se ela ACONTECEU —
    é o fato de leitura que autoriza a máquina de push a declarar `reconciliado`
    (ADR-0011 P8; ACH-O3-9). Sem este relato, o pedinte só sabia que o contador
    mudou, o que não é evidência de nada.
  */
  useRelatorioDeLeitura({
    buscaEmCurso: recurso.buscaEmCurso,
    obtidoEm: recurso.obtidoEm,
    falhou: ehEstadoDeFalha(recurso.estadoTela),
    sinal: sinalDeReleitura,
    relatar: aoRelatarLeitura,
  });

  const [itens, setItens] = useState<ItemGradeLeito[] | null>(null);

  // Sincroniza a cópia local editável (usada pelo reconhecimento otimista de
  // exibição, nunca de estado) com o que a última leitura trouxe.
  useEffect(() => {
    setItens(recurso.dados);
  }, [recurso.dados]);

  /*
    MARGEM DE RENDER (MIN-7): o conteúdo NÃO precisa esperar a rodada extra do
    efeito acima. `itens` só existe para a EDIÇÃO otimista do reconhecimento de
    alerta; enquanto nenhuma edição ocorreu, exibir `recurso.dados` direto elimina
    um commit inteiro entre o dado chegar e o conteúdo existir — commit que, sob
    a suíte, era uma rodada a mais de act/consulta (a diferença entre a consulta
    de conteúdo custar 1 ciclo ou 2). Com a primeira edição, `itens` (não-nulo)
    passa a ter precedência e o comportamento otimista é PRESERVADO; o efeito
    acima continua colando a cópia a cada leitura nova.
  */
  const itensExibidos = itens ?? recurso.dados;
  const alertasPendentesDaTela = useMemo(
    () => (itensExibidos === null ? [] : alertasPendentes(itensExibidos)),
    [itensExibidos],
  );

  /**
   * Anúncio COALESCIDO (uma mensagem por leitura, com contagem), nunca uma
   * rajada por alerta — IA-P2/HAZ-0037. A dependência é `obtidoEm`, que muda
   * apenas quando uma leitura BEM-SUCEDIDA ocorre: uma falha não reanuncia
   * alertas antigos como se fossem novos.
   */
  useEffect(() => {
    if (recurso.obtidoEm === null || recurso.dados === null) return;
    marcarLeituraBemSucedida();
    const pendentes = alertasPendentes(recurso.dados);
    if (pendentes.length === 0) {
      setMensagemAoVivo(null);
      return;
    }
    const plural = pendentes.length === 1 ? "" : "s";
    setMensagemAoVivo(`${pendentes.length} alerta${plural} pendente${plural} na grade de leitos.`);
  }, [recurso.obtidoEm, recurso.dados, marcarLeituraBemSucedida]);

  function lidarComAlertaAtualizado(alertaAtualizado: Alerta) {
    setItens((atual) => {
      if (!atual) return atual;
      return atual.map((item) =>
        item.leitoId === alertaAtualizado.leitoId
          ? {
              ...item,
              alertas: item.alertas.map((a) =>
                a.alertaId === alertaAtualizado.alertaId ? alertaAtualizado : a,
              ),
            }
          : item,
      );
    });
    setMensagemAoVivo(`Alerta reconhecido em ${alertaAtualizado.leitoId}.`);
  }

  const estadoExibido = demonstrandoCarregando ? "carregando" : recurso.estadoTela;

  return (
    <section aria-labelledby="grade-leitos-titulo">
      <div className="cabecalho-tela">
        <h2 id="grade-leitos-titulo">Grade de leitos</h2>
        <button
          type="button"
          className="botao botao--secundario"
          onClick={recurso.recarregar}
          disabled={estadoExibido === "carregando" || estadoExibido === "retentando"}
        >
          Atualizar
        </button>
      </div>

      <IndicadorConectividade estado={conectividade} />
      <AvisoProntidao leitura={prontidao.leitura} />
      {/*
        `import.meta.env.DEV` é substituído por um LITERAL pelo Vite, então em
        produção este ramo vira código morto e o empacotador remove o módulo
        `ControleDemonstracao` do pacote. A guarda de runtime
        (`ehPerfilDesenvolvimento()`) permanece como segunda condição, mas
        sozinha ela NÃO bastava: por ser uma chamada de função, o empacotador
        não consegue provar que o ramo é inalcançável, e o controle vazava
        para o bundle de produção. Isso foi detectado por
        `src/build/guardaArtefatoSintetico.ts` reprovando o build — a razão de
        aquela terceira defesa existir.
      */}
      {import.meta.env.DEV && emDesenvolvimento && (
        <ControleDemonstracao valor={modoDemo} aoMudar={setModoDemo} />
      )}
      <RegiaoAoVivoAlertas mensagem={mensagemAoVivo} />
      <RotuloFrescorVisao frescor={recurso.frescorVisao} obtidoEm={recurso.obtidoEm} />
      <RotuloIdadeVisao
        idade={recurso.idadeVisao}
        obtidoEm={recurso.obtidoEm}
        buscaEmCurso={recurso.buscaEmCurso}
        cadencia={recurso.cadencia}
      />
      <RotuloCadenciaRecarga cadencia={recurso.cadencia} visibilidade={recurso.visibilidadeDaAba} />

      <EstadoTela
        estado={estadoExibido}
        contexto="grade de leitos"
        {...(recurso.problema?.detail !== undefined ? { detalhe: recurso.problema.detail } : {})}
        aoTentarNovamente={recurso.recarregar}
        tentativas={recurso.tentativas}
      >
        {itensExibidos && (
          <>
            <ul className="grade-leitos">
              {itensExibidos.map((item) => (
                <CartaoLeito key={item.leitoId} item={item} aoSelecionar={aoSelecionarLeito} />
              ))}
            </ul>
            <PainelAlertas
              alertas={alertasPendentesDaTela}
              cliente={cliente}
              aoAlertaAtualizado={lidarComAlertaAtualizado}
              tituloRegiao="Alertas ativos"
              comandosBloqueados={conectividade === "offline"}
            />
          </>
        )}
      </EstadoTela>

      {/*
        Após uma falha de recarga, o conteúdo anterior CONTINUA visível (uma
        tela calma sem dado é proibida) — mas `EstadoTela` já declarou o erro
        acima e `RotuloFrescorVisao` marcou o conteúdo como não-atual. Sem
        este bloco, uma falha esconderia a grade inteira; com ele, o dado
        aparece sempre acompanhado do seu rótulo de frescor.
      */}
      {recurso.exibindoDadoDesatualizado && itensExibidos && (
        <ul className="grade-leitos grade-leitos--desatualizada">
          {itensExibidos.map((item) => (
            <CartaoLeito key={item.leitoId} item={item} aoSelecionar={aoSelecionarLeito} />
          ))}
        </ul>
      )}
    </section>
  );
}
