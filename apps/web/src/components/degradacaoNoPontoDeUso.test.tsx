/**
 * apps/web/src/components/degradacaoNoPontoDeUso.test.tsx
 *
 * TESTE DE ACEITE 4 do despacho LAC-L1/LAC-L2: `/v1/readyz` em 503 produz
 * degradação VISÍVEL NO PONTO DE USO CLÍNICO, com a razão CODIFICADA do
 * relatório — e a asserção afirma que o CÓDIGO aparece, não apenas que "algo
 * apareceu".
 *
 * POR QUE "no ponto de uso" é asserção e não estilo. `SAF-0025`: "The interface
 * MUST never appear healthy when feeds, workers, rules, identity, or freshness
 * are impaired. Operator-only dashboards do not satisfy this requirement."
 * `QAS-0023` mede "count of degradations with no user-visible representation
 * (must be zero)" — e enquanto nenhuma superfície clínica consumia `readyz`,
 * essa contagem era ≥ 1.
 *
 * Rastreio: LAC-L2, ADR-0011 P6, ADR-0020 O4, SAF-0025, QAS-0023, HAZ-0025.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import type { LeitorDeProntidao, LeituraDeProntidao } from "../api/prontidao.js";
import { criarLeitorDeProntidaoHttp, interpretarProntidao } from "../api/prontidao.js";
import type { ClienteApiIntensiCare, RespostaApi } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { INTERVALO_RECARGA_PADRAO_MS, TEMPO_LIMITE_PADRAO_MS } from "../estado/recursoRemoto.js";
import { criarRelogioDeTeste, type RelogioDeTeste } from "../teste/relogioDeTeste.js";
import { DetalhePaciente } from "./DetalhePaciente.js";
import { GradeLeitos } from "./GradeLeitos.js";

const LEITO: ItemGradeLeito = {
  leitoId: "SYNTH-LEITO-01",
  pacienteRef: "amh:psr:v1:SYNTH-P001",
  pacienteApelido: "Paciente SYNTH-P001",
  avaliacao: null,
  alertas: [],
};

function clienteSaudavel(): ClienteApiIntensiCare {
  return {
    listarGradeLeitos: async (): Promise<RespostaApi<ItemGradeLeito[]>> => ({
      estadoCarregamento: "pronto",
      dados: [LEITO],
      problema: null,
    }),
    obterAvaliacaoPaciente: async (): Promise<RespostaApi<ItemGradeLeito>> => ({
      estadoCarregamento: "pronto",
      dados: LEITO,
      problema: null,
    }),
    reconhecerAlerta: async (): Promise<RespostaApi<Alerta>> => ({
      estadoCarregamento: "erro",
      dados: null,
      problema: null,
    }),
  };
}

/**
 * Corpo REAL desta instalação: `/v1/readyz` responde 503 permanente porque não
 * há artefato de bundle para RULE-GCS e nenhum alvo de frescor foi validado.
 * Ver `apps/api/src/index.test.ts` ("503 aqui é o RETRATO HONESTO do estado").
 */
const CORPO_503 = {
  veredito: "degraded",
  razoes: [
    { codigo: "rule_bundle_unavailable", detalhe: "Nenhum bundle de regra ativo para RULE-GCS." },
    {
      codigo: "projection_freshness_threshold_unvalidated",
      detalhe: "Nenhum alvo de frescor de projeção foi validado (Gate G1).",
    },
  ],
  perfil: { somenteSintetico: true, declaracaoPt: "Perfil sintético." },
  degradacoes: [],
  limitesDeFrescorDeclarados: [{ projecao: "grade_leitos", limiteMs: null }],
};

function leitorFixo(leitura: LeituraDeProntidao): LeitorDeProntidao {
  return { obter: async () => leitura };
}

function leitor503(): LeitorDeProntidao {
  return criarLeitorDeProntidaoHttp({
    fetchImpl: async () =>
      new Response(JSON.stringify(CORPO_503), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
  });
}

function propsDeTempo() {
  return { relogio: criarRelogioDeTeste(), intervaloRecargaMs: INTERVALO_RECARGA_PADRAO_MS };
}

/**
 * Leitor de prontidão decidido por chamada. `responder(n)` devolve a leitura da
 * n-ésima chamada (1-based), ou `null` para "esta leitura PENDURA" — e uma
 * leitura pendurada REJEITA quando o sinal aborta, exatamente como
 * `criarLeitorDeProntidaoHttp` faz: ele converte falha de rede em
 * `inalcancavel`, mas PROPAGA o aborto de propósito (é assim que o hook
 * distingue "cancelei" de "falhou", invariante I5 de `recursoRemoto.ts`).
 */
function leitorPorChamada(responder: (n: number) => LeituraDeProntidao | null): {
  readonly leitor: LeitorDeProntidao;
  readonly leituras: () => number;
} {
  let n = 0;
  return {
    leituras: () => n,
    leitor: {
      obter: (sinal?: AbortSignal): Promise<LeituraDeProntidao> => {
        n += 1;
        const leitura = responder(n);
        if (leitura !== null) return Promise.resolve(leitura);
        return new Promise<LeituraDeProntidao>((_resolver, rejeitar) => {
          if (sinal === undefined) return;
          if (sinal.aborted) {
            rejeitar(sinal.reason);
            return;
          }
          sinal.addEventListener(
            "abort",
            () => {
              rejeitar(sinal.reason);
            },
            { once: true },
          );
        });
      },
    },
  };
}

const PRONTO: LeituraDeProntidao = interpretarProntidao(200, { veredito: "ready", razoes: [] });

/** Avança o relógio injetado dentro de `act` e deixa as microtarefas correrem. */
async function avancar(relogio: RelogioDeTeste, ms: number): Promise<void> {
  await act(async () => {
    relogio.avancar(ms);
    await Promise.resolve();
  });
}

describe("ACEITE L2-4 — readyz em 503 aparece na tela clínica com o CÓDIGO da razão", () => {
  it("GradeLeitos: exibe o aviso de prontidão com os códigos do vocabulário fechado", async () => {
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );

    const aviso = await screen.findByTestId("aviso-prontidao");
    expect(aviso.getAttribute("data-prontidao")).toBe("degraded");
    expect(aviso.getAttribute("data-status-http")).toBe("503");

    // O CÓDIGO aparece — não apenas "algo apareceu".
    expect(aviso.querySelector('[data-codigo-razao="rule_bundle_unavailable"]')).not.toBeNull();
    expect(
      aviso.querySelector('[data-codigo-razao="projection_freshness_threshold_unvalidated"]'),
    ).not.toBeNull();
    expect(aviso.textContent ?? "").toContain("rule_bundle_unavailable");

    // E o texto da razão é o DO SERVIDOR, verbatim — o frontend não redige
    // uma segunda versão da mesma frase (ADR-0008 N3, ADR-0021 F3).
    expect(aviso.textContent ?? "").toContain("Nenhum bundle de regra ativo para RULE-GCS.");
  });

  it("a degradação chega ao indicador de conectividade — ponto de uso, não painel de operador", async () => {
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
        "degradado",
      );
    });
    // A orientação de fallback institucional acompanha o estado degradado
    // (service-blueprint F10).
    expect(screen.getByTestId("indicador-conectividade").textContent ?? "").toMatch(
      /procedimento institucional/i,
    );
  });

  it("DetalhePaciente também declara — a degradação não fica só na tela inicial", async () => {
    render(
      <DetalhePaciente
        leitoId="SYNTH-LEITO-01"
        cliente={clienteSaudavel()}
        aoVoltar={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );

    const aviso = await screen.findByTestId("aviso-prontidao");
    expect(aviso.textContent ?? "").toContain("rule_bundle_unavailable");
  });

  it("a tela clínica CONTINUA sendo exibida — a degradação qualifica, não apaga", async () => {
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );
    await screen.findByTestId("aviso-prontidao");
    expect(screen.getAllByText(/SYNTH-LEITO-01/).length).toBeGreaterThan(0);
  });

  it("o aviso é POLIDO, não assertivo (o canal assertivo é do alerta clínico)", async () => {
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );
    const aviso = await screen.findByTestId("aviso-prontidao");
    // IA-P2/HAZ-0037: três regiões assertivas disparando juntas produzem
    // rajada. Este banner é persistente e pode durar horas.
    expect(aviso.getAttribute("role")).toBe("status");
    expect(aviso.getAttribute("aria-live")).toBe("polite");
  });

  it("veredito `ready` NÃO produz selo permanente", async () => {
    const leitura = interpretarProntidao(200, { veredito: "ready", razoes: [] });
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitorFixo(leitura)}
        {...propsDeTempo()}
      />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);
    expect(screen.queryByTestId("aviso-prontidao")).toBeNull();
  });

  it("readyz inalcançável também declara — fail-closed, nunca silêncio", async () => {
    const leitor = criarLeitorDeProntidaoHttp({
      fetchImpl: () => Promise.reject(new Error("rede sintética fora")),
    });
    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor}
        {...propsDeTempo()}
      />,
    );

    const aviso = await screen.findByTestId("aviso-prontidao");
    expect(aviso.getAttribute("data-prontidao")).toBe("nao_lida");
    expect(aviso.getAttribute("data-origem-prontidao")).toBe("inalcancavel");
    expect(aviso.textContent ?? "").toMatch(/não foi possível ler a declaração de prontidão/i);
  });

  /**
   * REGRESSÃO OBSERVADA EM NAVEGADOR REAL (2026-08-18). `/v1/readyz` devolve o
   * MESMO código de razão mais de uma vez, com `detalhe` diferente — uma
   * ocorrência por projeção sem alvo de frescor validado. A primeira versão
   * deste componente usava o código como chave do React, que reclamou de chave
   * duplicada e podia OMITIR linhas: degradação sem representação visível, o
   * que QAS-0023 exige que seja zero. A suíte de componentes com dublê não
   * pegou, porque o dublê tinha códigos únicos.
   */
  it("códigos REPETIDOS com detalhes diferentes aparecem TODOS — nenhum é deduplicado", async () => {
    const leitura = interpretarProntidao(503, {
      veredito: "degraded",
      razoes: [
        {
          codigo: "projection_freshness_threshold_unvalidated",
          detalhe: "Projeção grade_leitos sem alvo validado.",
        },
        {
          codigo: "projection_freshness_threshold_unvalidated",
          detalhe: "Projeção avaliacoes_paciente sem alvo validado.",
        },
        {
          codigo: "projection_freshness_threshold_unvalidated",
          detalhe: "Projeção fluxo_eventos sem alvo validado.",
        },
      ],
    });

    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitorFixo(leitura)}
        {...propsDeTempo()}
      />,
    );

    const aviso = await screen.findByTestId("aviso-prontidao");
    expect(
      aviso.querySelectorAll('[data-codigo-razao="projection_freshness_threshold_unvalidated"]'),
    ).toHaveLength(3);
    for (const projecao of ["grade_leitos", "avaliacoes_paciente", "fluxo_eventos"]) {
      expect(aviso.textContent ?? "").toContain(`Projeção ${projecao} sem alvo validado.`);
    }
  });

  it("sem leitor, a tela NÃO afirma nada sobre prontidão (nem pronto, nem degradado)", async () => {
    render(
      <GradeLeitos cliente={clienteSaudavel()} aoSelecionarLeito={() => {}} {...propsDeTempo()} />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);
    expect(screen.queryByTestId("aviso-prontidao")).toBeNull();
    expect(screen.queryByTestId("indicador-conectividade")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ACEITE L2-5 — uma prontidão que já foi lida com SUCESSO e depois morre
// ---------------------------------------------------------------------------

/**
 * DEFEITO REPRODUZIDO ANTES DA CORREÇÃO (revisão adversarial do PR #8, P1).
 *
 * Todo caso acima observa a prontidão a partir de uma tela que NUNCA teve
 * leitura boa. O caminho descoberto era o inverso, e é o que acontece de
 * verdade numa jornada de plantão: `/v1/readyz` responde `ready` uma vez, o
 * clínico deixa a aba aberta, e a superfície de prontidão PARA de responder.
 *
 * `useProntidao` fazia `recurso.dados ?? (ehEstadoDeFalha(...) ? inalcancavel :
 * null)`. O fail-closed estava DEPOIS do `??`, logo só disparava quando não
 * havia leitura anterior. Com um `ready` velho em `recurso.dados`, uma falha ou
 * tempo esgotado posterior mantinha esse `ready` como se fosse o estado
 * corrente: `prontidaoObrigaDegradacao` devolvia `false`, nenhum aviso era
 * renderizado e o indicador de conectividade continuava calmo — a tela
 * "appearing healthy" que `SAF-0025` proíbe literalmente, com a agravante de
 * que a leitura de prontidão estava MORTA.
 *
 * É também o anti-padrão 14 do contrato comum ("exibir dado stale como atual
 * após erro") aplicado ao insumo cuja função é justamente denunciar degradação.
 */
describe("ACEITE L2-5 — prontidão lida com sucesso e depois morta não conta como atual", () => {
  it("um `ready` anterior NÃO sobrevive a um tempo esgotado — a tela declara não-lida", async () => {
    const relogio = criarRelogioDeTeste();
    // 1ª leitura: `ready`. Da 2ª em diante o servidor pendura.
    const { leitor, leituras } = leitorPorChamada((n) => (n === 1 ? PRONTO : null));

    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
      />,
    );

    await screen.findAllByText(/SYNTH-LEITO-01/);
    await waitFor(() => {
      expect(leituras()).toBe(1);
    });
    // Aqui a calma é LEGÍTIMA: o servidor acabou de declarar `ready`.
    expect(screen.queryByTestId("aviso-prontidao")).toBeNull();
    expect(screen.queryByTestId("indicador-conectividade")).toBeNull();

    // Ciclo 2 da prontidão começa e pendura; o tempo limite o aborta.
    await avancar(relogio, INTERVALO_RECARGA_PADRAO_MS);
    await waitFor(() => {
      expect(leituras()).toBe(2);
    });
    await avancar(relogio, TEMPO_LIMITE_PADRAO_MS);

    const aviso = await screen.findByTestId("aviso-prontidao");
    expect(
      aviso.getAttribute("data-prontidao"),
      "o `ready` da leitura anterior continuou valendo como estado corrente",
    ).toBe("nao_lida");
    expect(aviso.getAttribute("data-origem-prontidao")).toBe("inalcancavel");
    expect(aviso.textContent ?? "").toMatch(/não foi possível ler a declaração de prontidão/i);

    // E a degradação chega ao ponto de uso, não a um painel de operador.
    await waitFor(() => {
      expect(screen.getByTestId("indicador-conectividade").getAttribute("data-conectividade")).toBe(
        "degradado",
      );
    });
  });

  it("a prontidão volta sozinha quando o servidor volta — o ciclo dela não morre", async () => {
    const relogio = criarRelogioDeTeste();
    // `ready` → pendura (aborta por tempo esgotado) → `ready` de novo.
    const { leitor, leituras } = leitorPorChamada((n) => (n === 2 ? null : PRONTO));

    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
      />,
    );
    await screen.findAllByText(/SYNTH-LEITO-01/);
    await waitFor(() => {
      expect(leituras()).toBe(1);
    });

    await avancar(relogio, INTERVALO_RECARGA_PADRAO_MS);
    await avancar(relogio, TEMPO_LIMITE_PADRAO_MS);
    await screen.findByTestId("aviso-prontidao");

    // Sem clique nenhum: o ciclo de prontidão continua e a leitura boa volta.
    await avancar(relogio, INTERVALO_RECARGA_PADRAO_MS);
    await waitFor(() => {
      expect(leituras(), "a releitura de prontidão morreu após um tempo esgotado").toBe(3);
    });
    await waitFor(() => {
      expect(screen.queryByTestId("aviso-prontidao")).toBeNull();
    });
    expect(screen.queryByTestId("indicador-conectividade")).toBeNull();
  });

  it("um `degraded` anterior também não sobrevive: a razão velha some junto com a leitura", async () => {
    const relogio = criarRelogioDeTeste();
    const degradado = interpretarProntidao(503, CORPO_503);
    const { leitor } = leitorPorChamada((n) => (n === 1 ? degradado : null));

    render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={INTERVALO_RECARGA_PADRAO_MS}
      />,
    );

    const primeiro = await screen.findByTestId("aviso-prontidao");
    expect(primeiro.textContent ?? "").toContain("rule_bundle_unavailable");

    await avancar(relogio, INTERVALO_RECARGA_PADRAO_MS);
    await avancar(relogio, TEMPO_LIMITE_PADRAO_MS);

    await waitFor(() => {
      expect(screen.getByTestId("aviso-prontidao").getAttribute("data-prontidao")).toBe("nao_lida");
    });
    // As razões do servidor eram fatos da leitura ANTERIOR. Mantê-las ao lado
    // de "não consegui ler" faria a tela afirmar duas coisas incompatíveis
    // sobre o mesmo instante (ADR-0021 F3).
    expect(screen.getByTestId("aviso-prontidao").textContent ?? "").not.toContain(
      "rule_bundle_unavailable",
    );
  });
});

// ---------------------------------------------------------------------------
// axe-core sobre as superfícies NOVAS
// ---------------------------------------------------------------------------

/**
 * As mesmas regras desligadas de `../a11y/acessibilidade.test.tsx`, pela mesma
 * razão: jsdom não computa estilo cascateado nem caixa, então um verde de
 * contraste ou de alvo de toque aqui seria FALSO. Elas são cobertas pela suíte
 * de navegador (`e2e/acessibilidade.spec.ts`, axe real com CSS real).
 *
 * E, como lá: nenhum verde aqui declara acessibilidade validada (ADR-0021 F7).
 * Validação com usuário de tecnologia assistiva permanece NÃO EXECUTADA.
 */
const REGRAS_DESLIGADAS_EM_JSDOM = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
} as const;

async function verificarAxe(container: HTMLElement): Promise<void> {
  const resultado = await axe.run(container, {
    rules: REGRAS_DESLIGADAS_EM_JSDOM as unknown as axe.RuleObject,
  });
  expect(resultado.violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.length} nó(s)`)).toEqual(
    [],
  );
}

describe("axe-core — as superfícies novas (idade da visão e prontidão)", () => {
  it("grade com aviso de prontidão degradada não tem violação", async () => {
    const { container } = render(
      <GradeLeitos
        cliente={clienteSaudavel()}
        aoSelecionarLeito={() => {}}
        leitorProntidao={leitor503()}
        {...propsDeTempo()}
      />,
    );
    await screen.findByTestId("aviso-prontidao");
    await verificarAxe(container);
  });

  it("grade com ciclo de releitura perdido não tem violação", async () => {
    const relogio = criarRelogioDeTeste();
    // A 1ª leitura traz dado; as releituras ficam em voo — assim a idade só
    // pode crescer e a classe chega a `ciclo_perdido`.
    let chamadas = 0;
    const cliente: ClienteApiIntensiCare = {
      ...clienteSaudavel(),
      listarGradeLeitos: (): Promise<RespostaApi<ItemGradeLeito[]>> => {
        chamadas += 1;
        if (chamadas === 1) {
          return Promise.resolve({
            estadoCarregamento: "pronto",
            dados: [LEITO],
            problema: null,
          });
        }
        return new Promise<RespostaApi<ItemGradeLeito[]>>(() => {
          /* nunca resolve */
        });
      },
    };

    const { container } = render(
      <GradeLeitos
        cliente={cliente}
        aoSelecionarLeito={() => {}}
        relogio={relogio}
        sortear={() => 0.5}
        intervaloRecargaMs={30_000}
      />,
    );
    await screen.findByTestId("rotulo-idade-visao");

    await act(async () => {
      relogio.avancar(90_000);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId("rotulo-idade-visao").getAttribute("data-idade-visao")).toBe(
        "ciclo_perdido",
      );
    });

    await verificarAxe(container);
  });
});
