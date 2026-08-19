/**
 * apps/web/src/estado/conectividade.ts
 *
 * 5ª família do §11 (conectividade). Parte pura + hook.
 *
 * HONESTIDADE DE CAPACIDADE — TEXTO REESCRITO PORQUE O FATO MUDOU.
 *
 * Até a fiação do transporte SSE na árvore de UI, este cabeçalho declarava que
 * "esta fatia NÃO tem canal de eventos em tempo real" e que
 * `reproduzindo`/`reconciliado` não tinham transporte que os originasse. Era
 * verdade e era importante dizê-lo. Deixou de ser verdade no instante em que
 * `App.tsx` passou a montar `useFluxoDeEventos` (`../eventos/`), e um texto de
 * honestidade que sobrevive à mudança que o desmente é pior do que nenhum: ele
 * empresta credibilidade a uma afirmação falsa.
 *
 * O QUE É VERDADE AGORA, com as fronteiras intactas:
 *
 *   - existe canal de push (SSE, ADR-0011 P4), com ticket efêmero, cursor de
 *     retomada e replay finito. Ele NÃO é chamado de "tempo real" em lugar
 *     nenhum (anti-padrão 11 do contrato comum);
 *   - o push NUNCA traz dado clínico. Ele diz QUE releia; quem lê é a projeção
 *     autoritativa (`./recursoRemoto.ts`, ADR-0011 P7/P8). O caminho de verdade
 *     continua sendo o polling — o push é otimização SOBRE ele, jamais o
 *     contrário;
 *   - `reproduzindo` e `reconciliado` passaram a ter ORIGEM REAL, pela ponte
 *     `CONECTIVIDADE_POR_ESTADO_CONEXAO` (`../eventos/porta.ts`). Deixaram de
 *     ser apenas catálogo de apresentação.
 *
 * `useConectividadeNavegador` (abaixo) continua produzindo só o que o NAVEGADOR
 * sabe por si: `online`, `offline` e `reconectando`. Ele não foi ligado ao
 * push — o estado do fio entra pelo ponto de uso, composto por
 * `combinarConectividade` e `refinarComEstadoDoPush`.
 *
 * Rastreio: ADR-0011 P4/P6/P7/P8, ADR-0021 F4, service-blueprint F2/F10.
 */
import { useCallback, useEffect, useState } from "react";
import type { EstadoConectividade } from "../domain/estados.js";

/** Estado de transporte que o NAVEGADOR consegue afirmar por si só. */
export type ConectividadeNavegador = "online" | "offline" | "reconectando";

/**
 * Combina o que o navegador sabe com o que a tela sabe. PURA e testada
 * isoladamente.
 *
 * Precedência deliberada: `offline` > `reconectando` > `degradado` > `online`.
 * Um estado mais grave nunca é ocultado por um mais brando — a regra espelha
 * a precedência de avaliação da ADR-0008 (P-a) aplicada a transporte.
 *
 * `degradado` significa: a conexão existe, mas há algo que impede tratar o que
 * está na tela como retrato corrente. O parâmetro é um BOOLEANO COMPOSTO pelo
 * chamador, e desde o fechamento de LAC-L1/LAC-L2 ele tem três origens, sem
 * que uma esconda a outra (ver `../components/GradeLeitos.tsx`):
 *
 *   1. a última leitura FALHOU e a tela exibe conteúdo anterior
 *      (`exibindoDadoDesatualizado`, frescor da visão);
 *   2. a releitura automática parou de produzir dado novo
 *      (`idadeVisao.classe === "ciclo_perdido"`, LAC-L1);
 *   3. o próprio SERVIÇO declarou não ter capacidade segura
 *      (`GET /v1/readyz`, `../api/prontidao.ts`, LAC-L2).
 *
 * A composição fica no chamador de propósito: esta função é pura e não sabe
 * de rede, de relógio nem de sonda. O modelo de estados §6 é explícito — "a
 * degradação aparece no ponto de uso clínico" e "tela calma sem dado é
 * proibida"; SAF-0025 acrescenta que painel de operador NÃO satisfaz.
 */
export function combinarConectividade(
  navegador: ConectividadeNavegador,
  degradado: boolean,
): EstadoConectividade {
  if (navegador === "offline") return "offline";
  if (navegador === "reconectando") return "reconectando";
  if (degradado) return "degradado";
  return "online";
}

/**
 * Estados que o PUSH origina e que são INFORMATIVOS — menos severos que
 * `degradado`. Só estes dois entram por `refinarComEstadoDoPush`.
 */
const ESTADOS_INFORMATIVOS_DO_PUSH: ReadonlySet<EstadoConectividade> = new Set<EstadoConectividade>(
  ["reproduzindo", "reconciliado"],
);

/**
 * Deixa o estado do PUSH aparecer na tela — e só quando não há nada mais grave
 * a dizer.
 *
 * POR QUE UMA SEGUNDA FUNÇÃO, E NÃO UM PARÂMETRO A MAIS EM
 * `combinarConectividade`. A precedência `offline > reconectando > degradado >
 * online` é decisão registrada e não se mexe nela. Esta função opera APENAS
 * sobre o caso `online`, isto é, sobre o ponto em que a composição anterior já
 * concluiu que não há nada a declarar. É uma extensão na cauda, e é
 * estruturalmente incapaz de esconder um estado mais grave — há teste para
 * exatamente isso.
 *
 * POR QUE SÓ `reproduzindo` E `reconciliado`. Os outros quatro estados do fio
 * já têm caminho próprio e melhor:
 *   - `degraded`, `offline` e `reconnecting` do PUSH entram pelo booleano
 *     aditivo de degradação (`pushDegradaATela`, `../eventos/maquina.ts`).
 *     Promovê-los aqui diria "a tela está offline" quando apenas o socket caiu
 *     — enquanto a projeção autoritativa segue sendo lida com sucesso pelo
 *     polling. Seria afirmar sobre o SISTEMA um fato que é só do fio;
 *   - `online` do push não afirma nada sobre a tela (`false` do booleano
 *     aditivo nunca significa "está em dia").
 *
 * ESTE PARÁGRAFO JÁ FOI FALSO, E É POR ISSO QUE O SEGUNDO PARÂMETRO ACEITA
 * `null` (ACH-O3-11). Ele afirmava que `degraded`/`offline`/`reconnecting`
 * "entram pelo booleano aditivo" — e não entravam em toda janela: enquanto o
 * push não tinha recebido nenhuma PULSAÇÃO, `pushDegradaATela` anulava os três,
 * e a tela ficava silenciosa com o fio dizendo `offline`. `replaying`, que é
 * INFORMATIVO e menos grave, passava por aqui e produzia banner. O mesmo estado
 * de fio afirmava coisas diferentes conforme já ter chegado, ou não, uma
 * pulsação — precedência invertida.
 *
 * Duas correções, e as duas eram necessárias: a prova de vida do push passou a
 * ser o fluxo ABERTO (não a pulsação), de modo que os graves entram de fato em
 * toda janela; e `useFluxoDeEventos` devolve `null` aqui enquanto o push não se
 * provou vivo, o que torna ESTRUTURALMENTE impossível promover um informativo
 * numa janela em que um grave ficaria mudo.
 */
export function refinarComEstadoDoPush(
  base: EstadoConectividade,
  push: EstadoConectividade | null,
): EstadoConectividade {
  if (base !== "online") return base;
  if (push === null) return base;
  return ESTADOS_INFORMATIVOS_DO_PUSH.has(push) ? push : base;
}

export interface ConectividadeNavegadorHook {
  readonly estado: ConectividadeNavegador;
  /**
   * Declara que uma leitura bem-sucedida ocorreu após a reconexão — encerra
   * `reconectando`. Chamado pela tela, porque só ela sabe se o dado voltou;
   * o evento `online` do navegador prova apenas que a placa de rede voltou,
   * não que o servidor respondeu.
   */
  readonly marcarLeituraBemSucedida: () => void;
}

/**
 * Acompanha a conectividade do navegador.
 *
 * `reconectando` é deliberadamente pegajoso: o evento `online` NÃO devolve o
 * estado a `online` sozinho. Ele significa apenas "o navegador acha que há
 * rede"; enquanto uma leitura não voltar de fato, a tela continua declarando
 * reconexão em curso. Voltar a "Conectado." na hora seria uma afirmação que
 * ninguém verificou.
 */
export function useConectividadeNavegador(): ConectividadeNavegadorHook {
  const [estado, setEstado] = useState<ConectividadeNavegador>(() =>
    typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "online",
  );

  useEffect(() => {
    function aoFicarOffline(): void {
      setEstado("offline");
    }
    function aoVoltarOnline(): void {
      setEstado((anterior) => (anterior === "offline" ? "reconectando" : anterior));
    }

    globalThis.addEventListener("offline", aoFicarOffline);
    globalThis.addEventListener("online", aoVoltarOnline);
    return () => {
      globalThis.removeEventListener("offline", aoFicarOffline);
      globalThis.removeEventListener("online", aoVoltarOnline);
    };
  }, []);

  const marcarLeituraBemSucedida = useCallback(() => {
    setEstado((anterior) => (anterior === "reconectando" ? "online" : anterior));
  }, []);

  return { estado, marcarLeituraBemSucedida };
}

/**
 * `true` quando comandos de escrita devem ser BLOQUEADOS. Modelo de estados
 * §6, `offline`: "comandos bloqueados ou enfileirados com aviso explícito —
 * nunca sucesso aparente". Esta fatia bloqueia (não enfileira): uma fila de
 * comandos clínicos exigiria política de conflito e de expiração que ninguém
 * ratificou.
 */
export function comandosBloqueados(estado: EstadoConectividade): boolean {
  return estado === "offline";
}
