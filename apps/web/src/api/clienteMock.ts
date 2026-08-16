/**
 * apps/web/src/api/clienteMock.ts
 *
 * Cliente em memória, alimentado por `./fixtures.ts`, que implementa a
 * porta `ClienteApiIntensiCare` (`./tipos.ts`).
 *
 * Integração SPR-G7-2: o cliente REAL do contrato existe
 * (`./clienteHttp.ts`) e é o padrão do app; este mock é MANTIDO
 * deliberadamente para testes de componente e para o modo `?mock` da URL
 * — nunca como fallback silencioso nem fonte paralela de verdade.
 *
 * Todo estado de leito/alerta é mantido em memória do processo (perdido
 * ao recarregar a página) — comportamento adequado a um mock de fatia,
 * nunca apresentado como persistência real.
 */
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import type { ClienteApiIntensiCare, ModoDemonstracao, OpcoesChamada, ProblemaLocal, RespostaApi } from "./tipos.js";
import { compor, criarDadosSinteticos } from "./fixtures.js";

const ATRASO_PADRAO_MS = 150;

function esperar(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function problemaPadrao(status: number, title: string, detail: string): ProblemaLocal {
  return {
    type: "about:blank",
    title,
    status,
    detail,
  };
}

function respostaForcada<T>(modo: ModoDemonstracao, dadosProntos: T | null): RespostaApi<T> {
  switch (modo) {
    case "carregando":
      // Não deveria ser resolvido como resposta final — ver nota em `listarGradeLeitos`.
      return { estadoCarregamento: "carregando", dados: null, problema: null };
    case "vazio":
      return { estadoCarregamento: "vazio", dados: null, problema: null };
    case "indisponivel":
      return {
        estadoCarregamento: "indisponivel",
        dados: null,
        problema: problemaPadrao(
          503,
          "Serviço indisponível",
          "Modo de demonstração — indisponibilidade forçada para revisão de UI, não é uma falha real.",
        ),
      };
    case "erro":
      return {
        estadoCarregamento: "erro",
        dados: null,
        problema: problemaPadrao(
          500,
          "Erro inesperado",
          "Modo de demonstração — erro forçado para revisão de UI, não é uma falha real.",
        ),
      };
    case "pronto":
      return { estadoCarregamento: "pronto", dados: dadosProntos, problema: null };
    default:
      return { estadoCarregamento: "pronto", dados: dadosProntos, problema: null };
  }
}

/** Cria um cliente mock com seu próprio estado em memória (isolado por instância — útil em teste). */
export function criarClienteMock(): ClienteApiIntensiCare {
  const dados = criarDadosSinteticos();
  const cacheIdempotencia = new Map<string, Alerta>();

  function leitosCompostos(): ItemGradeLeito[] {
    return dados.leitosBase.map((leitoBase) => compor(leitoBase, dados.alertas));
  }

  return {
    async listarGradeLeitos(opcoes?: OpcoesChamada): Promise<RespostaApi<ItemGradeLeito[]>> {
      await esperar(opcoes?.atrasoMs ?? ATRASO_PADRAO_MS);

      const leitos = leitosCompostos();

      if (opcoes?.forcarResultado) {
        return respostaForcada(opcoes.forcarResultado, leitos);
      }

      if (leitos.length === 0) {
        return { estadoCarregamento: "vazio", dados: null, problema: null };
      }

      return { estadoCarregamento: "pronto", dados: leitos, problema: null };
    },

    async obterAvaliacaoPaciente(
      leitoId: string,
      opcoes?: OpcoesChamada,
    ): Promise<RespostaApi<ItemGradeLeito>> {
      await esperar(opcoes?.atrasoMs ?? ATRASO_PADRAO_MS);

      const leitoBase = dados.leitosBase.find((item) => item.leitoId === leitoId);
      const leito = leitoBase ? compor(leitoBase, dados.alertas) : undefined;

      if (opcoes?.forcarResultado) {
        return respostaForcada(opcoes.forcarResultado, leito ?? null);
      }

      if (!leito) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: problemaPadrao(404, "Leito não encontrado", `Nenhum leito com identificador "${leitoId}".`),
        };
      }

      return { estadoCarregamento: "pronto", dados: leito, problema: null };
    },

    async reconhecerAlerta(
      alertaId: string,
      chaveIdempotencia: string,
      opcoes?: OpcoesChamada,
    ): Promise<RespostaApi<Alerta>> {
      await esperar(opcoes?.atrasoMs ?? ATRASO_PADRAO_MS);

      if (!chaveIdempotencia) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: problemaPadrao(
            400,
            "Cabeçalho de idempotência ausente",
            "Toda ação de reconhecer alerta exige uma chave de idempotência (mesma convenção de apps/api).",
          ),
        };
      }

      // Repetição idempotente: mesma chave -> mesmo resultado, sem duplicar o efeito.
      const resultadoAnterior = cacheIdempotencia.get(chaveIdempotencia);
      if (resultadoAnterior) {
        return { estadoCarregamento: "pronto", dados: resultadoAnterior, problema: null };
      }

      const indiceAlerta = dados.alertas.findIndex((alerta) => alerta.alertaId === alertaId);
      if (indiceAlerta === -1) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: problemaPadrao(404, "Alerta não encontrado", `Nenhum alerta com identificador "${alertaId}".`),
        };
      }

      const alertaAtual = dados.alertas[indiceAlerta];
      if (!alertaAtual) {
        return {
          estadoCarregamento: "erro",
          dados: null,
          problema: problemaPadrao(404, "Alerta não encontrado", `Nenhum alerta com identificador "${alertaId}".`),
        };
      }

      const alertaAtualizado: Alerta = {
        ...alertaAtual,
        estado: "reconhecido",
        reconhecidoPor: "SYNTH-PROFISSIONAL-ATUAL",
        reconhecidoEm: new Date().toISOString(),
      };
      dados.alertas[indiceAlerta] = alertaAtualizado;
      cacheIdempotencia.set(chaveIdempotencia, alertaAtualizado);

      return { estadoCarregamento: "pronto", dados: alertaAtualizado, problema: null };
    },
  };
}
