import { useCallback, useEffect, useState } from "react";
import type { ClienteApiIntensiCare, ModoDemonstracao } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { combinarConectividade, useConectividadeNavegador } from "../estado/conectividade.js";
import { useRecursoRemoto } from "../estado/recursoRemoto.js";
import { ehPerfilDesenvolvimento } from "../perfil.js";
import { IndicadorConectividade, RotuloFrescorVisao } from "./AvisosDeEstado.js";
import { CartaoLeito } from "./CartaoLeito.js";
import { ControleDemonstracao } from "./ControleDemonstracao.js";
import { EstadoTela } from "./EstadoTela.js";
import { PainelAlertas } from "./PainelAlertas.js";
import { RegiaoAoVivoAlertas } from "./RegiaoAoVivoAlertas.js";

interface GradeLeitosProps {
  cliente: ClienteApiIntensiCare;
  aoSelecionarLeito: (leitoId: string) => void;
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
export function GradeLeitos({ cliente, aoSelecionarLeito }: GradeLeitosProps) {
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
  });

  const conectividadeNavegador = useConectividadeNavegador();
  const marcarLeituraBemSucedida = conectividadeNavegador.marcarLeituraBemSucedida;
  const conectividade = combinarConectividade(
    conectividadeNavegador.estado,
    recurso.exibindoDadoDesatualizado,
  );

  const [itens, setItens] = useState<ItemGradeLeito[] | null>(null);

  // Sincroniza a cópia local editável (usada pelo reconhecimento otimista de
  // exibição, nunca de estado) com o que a última leitura trouxe.
  useEffect(() => {
    setItens(recurso.dados);
  }, [recurso.dados]);

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

      <EstadoTela
        estado={estadoExibido}
        contexto="grade de leitos"
        {...(recurso.problema?.detail !== undefined ? { detalhe: recurso.problema.detail } : {})}
        aoTentarNovamente={recurso.recarregar}
        tentativas={recurso.tentativas}
      >
        {itens && (
          <>
            <ul className="grade-leitos">
              {itens.map((item) => (
                <CartaoLeito key={item.leitoId} item={item} aoSelecionar={aoSelecionarLeito} />
              ))}
            </ul>
            <PainelAlertas
              alertas={alertasPendentes(itens)}
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
      {recurso.exibindoDadoDesatualizado && itens && (
        <ul className="grade-leitos grade-leitos--desatualizada">
          {itens.map((item) => (
            <CartaoLeito key={item.leitoId} item={item} aoSelecionar={aoSelecionarLeito} />
          ))}
        </ul>
      )}
    </section>
  );
}
