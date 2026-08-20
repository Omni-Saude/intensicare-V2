/**
 * apps/web/src/components/render.test.tsx
 *
 * Testes de renderização (smoke tests) via `react-dom/server`
 * `renderToStaticMarkup` — sem jsdom nem `@testing-library/react`
 * (nenhum dos dois está instalado nesta fatia; ver pendências no
 * README). `renderToStaticMarkup` roda em Node puro e não executa
 * `useEffect`, então componentes que buscam dados via efeito (GradeLeitos,
 * DetalhePaciente, App) só são exercitados no estado inicial
 * ("carregando") aqui — a lógica pós-busca é coberta separadamente por
 * `../api/clienteMock.test.ts` (dados) e `../domain/linguagem.test.ts`
 * (texto), e pelos componentes presentational testados diretamente com
 * dados injetados via props abaixo.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../App.js";
import { criarSessaoControlada } from "../api/sessao.js";
import type { ClienteApiIntensiCare } from "../api/tipos.js";
import type { Alerta, ItemGradeLeito } from "../domain/clinico.js";
import { BadgeTom } from "./BadgeTom.js";
import { BannerContexto } from "./BannerContexto.js";
import { CartaoLeito } from "./CartaoLeito.js";
import { ContribuicaoParametroLinha } from "./ContribuicaoParametroLinha.js";
import { ControleDemonstracao } from "./ControleDemonstracao.js";
import { DetalhePaciente } from "./DetalhePaciente.js";
import { EstadoTela } from "./EstadoTela.js";
import { GradeLeitos } from "./GradeLeitos.js";
import { PainelAlertas } from "./PainelAlertas.js";
import { ReconhecerAlerta } from "./ReconhecerAlerta.js";
import { RegiaoAoVivoAlertas } from "./RegiaoAoVivoAlertas.js";

/** Cliente-dublê que nunca resolve — usado só para exercitar o estado inicial ("carregando"). */
const clientePendente: ClienteApiIntensiCare = {
  listarGradeLeitos: () => new Promise(() => {}),
  obterAvaliacaoPaciente: () => new Promise(() => {}),
  reconhecerAlerta: () => new Promise(() => {}),
};

const alertaPendente: Alerta = {
  alertaId: "SYNTH-ALERTA-TESTE-1",
  leitoId: "Leito 01",
  pacienteRef: "amh:psr:v1:SYNTH-teste",
  severidade: "alerta",
  descricao: "Descrição sintética de teste.",
  criadoEm: "2026-08-16T10:00:00Z",
  estado: "nao_atribuido",
  versao: 0,
};

const alertaResolvido: Alerta = {
  ...alertaPendente,
  alertaId: "SYNTH-ALERTA-TESTE-2",
  estado: "resolvido",
  reconhecidoPor: "SYNTH-PROFISSIONAL-TESTE",
  reconhecidoEm: "2026-08-16T10:05:00Z",
};

const itemLeitoCompleto: ItemGradeLeito = {
  leitoId: "Leito 01",
  pacienteRef: "amh:psr:v1:SYNTH-teste",
  pacienteApelido: "Paciente SYNTH-teste",
  avaliacao: {
    estadoAvaliacao: "valida",
    news2Total: 2,
    bandaRisco: "normal",
    contribuicoes: [
      {
        parametro: "frequencia_respiratoria",
        rotulo: "Frequência respiratória",
        valorObservado: 16,
        unidade: "irpm",
        pontos: 0,
        frescor: "atual",
        horarioFonte: "2026-08-16T12:00:00Z",
        explicacao: "Frequência respiratória de 16 irpm — pontuação 0.",
      },
      {
        parametro: "nivel_consciencia",
        rotulo: "Nível de consciência",
        valorObservado: null,
        pontos: null,
        frescor: "ausente",
        horarioFonte: null,
        explicacao:
          "Nível de consciência: sem leitura registrada — insumo ausente, declarado explicitamente.",
      },
    ],
    insumosAusentes: ["nivel_consciencia"],
    insumosVelhos: [],
    motivos: [],
    anotacoes: [],
    explicacao: "SYNTH — explicação agregada do backend.",
    parametroVermelho: false,
    calculadoEm: "2026-08-16T12:00:00Z",
    versaoRegra: "news2-ilustrativo-0.0.1-synth",
  },
  alertas: [alertaPendente],
};

const itemLeitoNaoAvaliado: ItemGradeLeito = {
  ...itemLeitoCompleto,
  leitoId: "Leito 04",
  avaliacao: {
    estadoAvaliacao: "nao_avaliada",
    news2Total: null,
    bandaRisco: null,
    contribuicoes: [],
    insumosAusentes: ["saturacao_oxigenio", "uso_oxigenio_suplementar"],
    insumosVelhos: [],
    motivos: [],
    anotacoes: [],
    explicacao: "SYNTH — explicação agregada do backend.",
    parametroVermelho: false,
    calculadoEm: null,
    versaoRegra: "news2-ilustrativo-0.0.1-synth",
  },
  alertas: [],
};

const itemLeitoVago: ItemGradeLeito = {
  leitoId: "Leito 06",
  pacienteRef: null,
  pacienteApelido: null,
  avaliacao: null,
  alertas: [],
};

describe("BannerContexto", () => {
  it("anuncia caráter consultivo e dados sintéticos, sempre visível", () => {
    const html = renderToStaticMarkup(<BannerContexto />);
    expect(html).toMatch(/CONSULTIVO/);
    expect(html).toMatch(/100% sintéticos \(SYNTH\)/);
    expect(html).toMatch(/decisão clínica permanece sempre com o profissional/i);
  });

  it("exibe o rótulo vinculante 'registro limitado a esta instituição' (HAZ-0046; ADR-0004 §6.2; EC-R1.d)", () => {
    const html = renderToStaticMarkup(<BannerContexto />);
    expect(html).toMatch(/[Rr]egistro limitado a esta instituição/);
  });
});

describe("BadgeTom", () => {
  it("renderiza texto e glifo (nunca depende só de cor)", () => {
    const html = renderToStaticMarkup(<BadgeTom texto="Risco crítico" tom="critico" />);
    expect(html).toMatch(/Risco crítico/);
    expect(html).toMatch(/badge-tom--critico/);
    expect(html).toMatch(/aria-hidden="true"/);
  });
});

describe("EstadoTela", () => {
  it("carregando: role=status, aria-live=polite, sem filhos", () => {
    const html = renderToStaticMarkup(
      <EstadoTela estado="carregando" contexto="teste">
        <p>não deveria aparecer</p>
      </EstadoTela>,
    );
    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/Carregando…/);
    expect(html).not.toMatch(/não deveria aparecer/);
  });

  it("erro: role=alert, aria-live=assertive", () => {
    const html = renderToStaticMarkup(
      <EstadoTela estado="erro" contexto="teste" detalhe="Detalhe sintético." />,
    );
    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/aria-live="assertive"/);
    expect(html).toMatch(/Detalhe sintético\./);
  });

  it("indisponivel: role=alert (exige atenção imediata)", () => {
    const html = renderToStaticMarkup(<EstadoTela estado="indisponivel" contexto="teste" />);
    expect(html).toMatch(/role="alert"/);
  });

  it("vazio: mensagem 'nenhum item encontrado', sem filhos", () => {
    const html = renderToStaticMarkup(
      <EstadoTela estado="vazio" contexto="teste">
        <p>não deveria aparecer</p>
      </EstadoTela>,
    );
    expect(html).toMatch(/Nenhum item encontrado/i);
    expect(html).not.toMatch(/não deveria aparecer/);
  });

  it("pronto: renderiza os filhos", () => {
    const html = renderToStaticMarkup(
      <EstadoTela estado="pronto" contexto="teste">
        <p>conteúdo real</p>
      </EstadoTela>,
    );
    expect(html).toMatch(/conteúdo real/);
  });

  it("parcial: renderiza aviso E os filhos (transparência, nunca esconde o dado parcial)", () => {
    const html = renderToStaticMarkup(
      <EstadoTela estado="parcial" contexto="teste">
        <p>conteúdo parcial real</p>
      </EstadoTela>,
    );
    expect(html).toMatch(/parcialmente/i);
    expect(html).toMatch(/conteúdo parcial real/);
  });
});

describe("CartaoLeito", () => {
  it("leito com avaliação válida mostra NEWS2, banda de risco e frescor", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={itemLeitoCompleto} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/Leito 01/);
    expect(html).toMatch(/Paciente SYNTH-teste/);
    expect(html).toMatch(/NEWS2/);
    expect(html).toMatch(/Banda de risco: normal/);
    expect(html).toMatch(/badge-tom--positivo/);
  });

  it("item que NÃO traz o frescor do servidor não faz o cartão afirmar frescor", () => {
    /*
      HISTÓRICO DESTE TESTE, em duas etapas, porque a segunda mudou a PREMISSA
      da primeira e o teste teria virado uma tautologia se ficasse como estava.

      1) ACH-O3-12: o cartão derivava frescor de `avaliacao.contribuicoes`, e
         `mapearEntradaGrade` devolve `contribuicoes: []` para TODO leito (a
         projeção da grade é um resumo). `calcularFrescorGeral` traduzia a
         lista vazia em `"atual"` e cada cartão da UTI exibia "✓ Dado atual.",
         tom positivo, sobre zero evidência. A correção fez a lista vazia
         devolver `null` e o cartão calar-se.

      2) ADR-0011 P7 (agora): o cartão parou de DERIVAR. `EntradaGradeLeitos`
         publica `frescor` como campo OBRIGATÓRIO e é ele que o cartão exibe.
         Um item sem esse campo — construído à mão, nunca vindo do mapeador —
         continua não autorizando afirmação nenhuma sobre frescor.

      O que este teste guarda hoje é a etapa 2: AUSÊNCIA DE EVIDÊNCIA continua
      produzindo silêncio, e não um tom positivo.
    */
    const semFrescorDoServidor: ItemGradeLeito = { ...itemLeitoCompleto };
    delete (semFrescorDoServidor as { frescor?: unknown }).frescor;

    const html = renderToStaticMarkup(
      <CartaoLeito item={semFrescorDoServidor} aoSelecionar={() => {}} />,
    );

    // Guarda de não-vacuidade: o cartão FOI renderizado com conteúdo clínico.
    expect(html).toMatch(/NEWS2/);
    expect(html, "o cartão afirmou frescor sem o campo do servidor").not.toMatch(/Dado atual/);
  });

  it("frescor DECLARADO pelo servidor é o que aparece — o cartão não o deriva", () => {
    /*
      Sucessor direto do teste "insumo declarado INVÁLIDO nunca vira 'Dado
      atual'", que exercitava o caminho de DERIVAÇÃO removido por ADR-0011 P7.
      A invariante preservada é a mesma — o cartão nunca inventa um frescor
      melhor do que o declarado —, agora ancorada na fonte certa. A prova de
      que mexer nas contribuições não altera nada está em
      `./despachoNoPontoDeUso.test.tsx`.
    */
    const desatualizado: ItemGradeLeito = { ...itemLeitoCompleto, frescor: "desatualizado" };
    const html = renderToStaticMarkup(<CartaoLeito item={desatualizado} aoSelecionar={() => {}} />);

    expect(html).toMatch(/NEWS2/);
    expect(html).not.toMatch(/Dado atual/);
    expect(html).toMatch(/Dado desatualizado/);
  });

  it("leito com avaliação não computável (fail-closed) NUNCA mostra número de escore", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={itemLeitoNaoAvaliado} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/não computável/i);
    expect(html).not.toMatch(/NEWS2/);
  });

  it("leito vago mostra 'Leito vago' em vez de dado ausente parecendo normal (HAZ-0005)", () => {
    const html = renderToStaticMarkup(<CartaoLeito item={itemLeitoVago} aoSelecionar={() => {}} />);
    expect(html).toMatch(/Leito vago/);
    expect(html).not.toMatch(/NEWS2/);
  });

  it("é um <button> nativo — focalizável e ativável por teclado sem atributos extras", () => {
    const html = renderToStaticMarkup(
      <CartaoLeito item={itemLeitoCompleto} aoSelecionar={() => {}} />,
    );
    expect(html).toMatch(/<button/);
  });
});

describe("ContribuicaoParametroLinha", () => {
  it("parâmetro presente mostra valor, unidade, pontos e horário", () => {
    const html = renderToStaticMarkup(
      <ContribuicaoParametroLinha contribuicao={itemLeitoCompleto.avaliacao!.contribuicoes[0]!} />,
    );
    expect(html).toMatch(/Frequência respiratória/);
    expect(html).toMatch(/16/);
    expect(html).toMatch(/irpm/);
    expect(html).toMatch(/2026-08-16T12:00:00Z/);
  });

  it("insumo ausente declara 'não informado'/'não computado', nunca um valor inventado", () => {
    const html = renderToStaticMarkup(
      <ContribuicaoParametroLinha contribuicao={itemLeitoCompleto.avaliacao!.contribuicoes[1]!} />,
    );
    expect(html).toMatch(/não informado/);
    expect(html).toMatch(/não computado/);
    expect(html).toMatch(/nunca recebida/);
  });
});

describe("ReconhecerAlerta", () => {
  it("alerta pendente mostra o botão 'Reconhecer alerta'", () => {
    const html = renderToStaticMarkup(
      <ReconhecerAlerta
        alerta={alertaPendente}
        cliente={clientePendente}
        aoReconhecido={() => {}}
      />,
    );
    expect(html).toMatch(/Reconhecer alerta/);
  });

  it("alerta já resolvido não mostra ação de reconhecer", () => {
    const html = renderToStaticMarkup(
      <ReconhecerAlerta
        alerta={alertaResolvido}
        cliente={clientePendente}
        aoReconhecido={() => {}}
      />,
    );
    expect(html).toBe("");
  });
});

describe("PainelAlertas", () => {
  it("lista vazia declara explicitamente 'Nenhum alerta', nunca omite a seção", () => {
    const html = renderToStaticMarkup(
      <PainelAlertas
        alertas={[]}
        cliente={clientePendente}
        aoAlertaAtualizado={() => {}}
        tituloRegiao="Teste"
      />,
    );
    expect(html).toMatch(/Nenhum alerta/);
  });

  it("lista com um alerta pendente mostra severidade, estado e ação de reconhecer", () => {
    const html = renderToStaticMarkup(
      <PainelAlertas
        alertas={[alertaPendente]}
        cliente={clientePendente}
        aoAlertaAtualizado={() => {}}
        tituloRegiao="Teste"
      />,
    );
    expect(html).toMatch(/Banda de risco: alerta/);
    expect(html).toMatch(/Reconhecer alerta/);
  });
});

describe("ControleDemonstracao", () => {
  it("é rotulado explicitamente como demonstração, nunca como comportamento real", () => {
    const html = renderToStaticMarkup(<ControleDemonstracao valor={null} aoMudar={() => {}} />);
    expect(html).toMatch(/Modo de demonstração/);
    expect(html).toMatch(/não representa uma falha real/);
  });
});

describe("RegiaoAoVivoAlertas", () => {
  it("carrega role=alert e aria-live=assertive mesmo sem mensagem", () => {
    const html = renderToStaticMarkup(<RegiaoAoVivoAlertas mensagem={null} />);
    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/aria-live="assertive"/);
  });

  it("exibe a mensagem quando presente", () => {
    const html = renderToStaticMarkup(
      <RegiaoAoVivoAlertas mensagem="2 alertas pendentes na grade de leitos." />,
    );
    expect(html).toMatch(/2 alertas pendentes/);
  });
});

describe("Telas de nível superior — estado inicial (sem jsdom, useEffect não roda)", () => {
  it("GradeLeitos inicia em 'carregando'", () => {
    const html = renderToStaticMarkup(
      <GradeLeitos cliente={clientePendente} aoSelecionarLeito={() => {}} />,
    );
    expect(html).toMatch(/Carregando…/);
    expect(html).toMatch(/Grade de leitos/);
  });

  it("DetalhePaciente inicia em 'carregando'", () => {
    const html = renderToStaticMarkup(
      <DetalhePaciente leitoId="Leito 01" cliente={clientePendente} aoVoltar={() => {}} />,
    );
    expect(html).toMatch(/Carregando…/);
    expect(html).toMatch(/Voltar à grade de leitos/);
  });

  it("App renderiza o banner de contexto e a grade de leitos", () => {
    // ACH-07: `App` passou a RECEBER cliente e sessão por injeção (a criação
    // migrou para `api/resolverCliente.ts`, que é assíncrona porque o dublê
    // de desenvolvimento só é alcançável por `import()` dinâmico).
    const html = renderToStaticMarkup(
      <App
        cliente={clientePendente}
        sessao={criarSessaoControlada("ativa", "Bearer SYNTH-TESTE")}
      />,
    );
    expect(html).toMatch(/CONSULTIVO/);
    expect(html).toMatch(/Grade de leitos/);
    expect(html).toMatch(/lang="pt-BR"/);
  });

  it("App com sessão EXPIRADA não renderiza dado de paciente, e mantém o banner", () => {
    const html = renderToStaticMarkup(
      <App cliente={clientePendente} sessao={criarSessaoControlada("expirada", null)} />,
    );
    // O banner permanente nunca é removido condicionalmente (HAZ-0046).
    expect(html).toMatch(/CONSULTIVO/);
    expect(html).toMatch(/[Rr]egistro limitado a esta instituição/);
    // A tela clínica não é montada (modelo de estados §4; IA-N12). A âncora é
    // o id do cabeçalho da GRADE — o `<h1>` da casca contém "Grade de leitos"
    // legitimamente e não prova nada sobre a montagem da tela.
    expect(html).toMatch(/Sessão expirada/);
    expect(html).not.toMatch(/grade-leitos-titulo/);
    expect(html).not.toMatch(/grade-leitos/);
  });
});
