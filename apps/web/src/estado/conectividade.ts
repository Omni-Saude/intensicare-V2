/**
 * apps/web/src/estado/conectividade.ts
 *
 * 5ª família do §11 (conectividade). Parte pura + hook.
 *
 * HONESTIDADE DE CAPACIDADE (importante). Esta fatia NÃO tem canal de eventos
 * em tempo real: não há SSE, não há WebSocket, não há cursor de replay. Por
 * isso o hook abaixo NUNCA produz `reproduzindo` nem `reconciliado` a partir
 * de um evento real — produzi-los aqui seria afirmar uma capacidade
 * inexistente (anti-padrão 11 do contrato comum: "chamar replay finito de SSE
 * de tempo real"). Os dois identificadores continuam declarados, traduzidos e
 * renderizáveis (`../components/AvisosDeEstado.tsx`), e são demonstrados na
 * galeria de estados — rotulados como ainda não originados por transporte
 * real. Quando o canal existir (ADR-0011 P4), o hook passa a alimentá-los sem
 * mudança na camada de apresentação.
 *
 * O que o hook produz de verdade: `online`, `offline`, `reconectando` e
 * `degradado`.
 *
 * Rastreio: ADR-0011, ADR-0021 F4, service-blueprint F2/F10, ACH-07.
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
 * `degradado` significa: a conexão existe, mas a última leitura falhou e a
 * tela está exibindo conteúdo anterior. O modelo de estados §6 é explícito —
 * "a degradação aparece no ponto de uso clínico" e "tela calma sem dado é
 * proibida".
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
