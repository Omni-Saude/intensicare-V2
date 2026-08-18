/**
 * apps/web/src/api/fixtures.ts
 *
 * Dados 100% sintéticos para esta fatia. PREMISSA (reversível,
 * GDEC-0014/0015/0017): dados sintéticos são o default vinculante de
 * desenvolvimento (`docs/14-devsecops-and-delivery/politica-dados-sinteticas.md`).
 * Todo identificador de paciente/tenant carrega o marcador `SYNTH-` e
 * segue a forma `amh:psr:v1:SYNTH-<sufixo>` — deliberadamente distinta de
 * um PSR real (`amh:psr:v1:<uuidv4>`), no mesmo espírito de
 * `@intensicare/fixtures-sinteticas` (`generateSyntheticPsr`).
 *
 * Nota (integração SPR-G7-2): estes dados alimentam APENAS o cliente
 * mock (`clienteMock.ts` — mantido para testes de componente e modo
 * `?mock`); o fluxo real usa o cliente HTTP (`clienteHttp.ts`) contra a
 * API, cujo banco é semeado por `@intensicare/fixtures-sinteticas`. Os
 * geradores abaixo seguem a MESMA convenção `SYNTH-` daquele pacote.
 *
 * Nenhum dado aqui é ou deriva de PHI real. Nenhuma alegação de
 * efetividade clínica é feita pelos valores escolhidos — são
 * ilustrativos, escolhidos para exercitar os estados de UI exigidos.
 */
import type {
  Alerta,
  AvaliacaoPaciente,
  ContribuicaoParametro,
  ItemGradeLeito,
  ParametroId,
} from "../domain/clinico.js";
import {
  calcularBandaRisco,
  pontuarFrequenciaCardiaca,
  pontuarFrequenciaRespiratoria,
  pontuarNivelConsciencia,
  pontuarPressaoSistolica,
  pontuarSaturacaoOxigenio,
  pontuarTemperatura,
  pontuarUsoOxigenioSuplementar,
  ROTULO_PARAMETRO,
  somarPontos,
  VERSAO_REGRA_NEWS2_ILUSTRATIVA,
} from "../domain/news2.js";

/** Marcador obrigatório de qualquer identificador sintético (ver aviso acima). */
export const MARCADOR_SINTETICO = "SYNTH-" as const;

export function gerarPsrSintetico(sufixo: string): string {
  return `amh:psr:v1:${MARCADOR_SINTETICO}${sufixo}`;
}

interface LeituraSintetica {
  parametro: ParametroId;
  valor: number | boolean;
  unidade?: string;
  horarioFonte: string | null;
  frescor: ContribuicaoParametro["frescor"];
}

const AGORA_SINTETICO = "2026-08-16T12:00:00Z";

function explicacaoParametro(
  parametro: ParametroId,
  valor: number | boolean,
  pontos: number,
): string {
  const rotulo = ROTULO_PARAMETRO[parametro];
  switch (parametro) {
    case "frequencia_respiratoria":
      return `${rotulo} de ${valor} irpm — pontuação ${pontos} na tabela ilustrativa desta fatia.`;
    case "saturacao_oxigenio":
      return `${rotulo} de ${valor}% — pontuação ${pontos}.`;
    case "uso_oxigenio_suplementar":
      return `${rotulo}: ${valor ? "em uso" : "ar ambiente"} — pontuação ${pontos}.`;
    case "temperatura":
      return `${rotulo} de ${valor} °C — pontuação ${pontos}.`;
    case "pressao_arterial_sistolica":
      return `${rotulo} de ${valor} mmHg — pontuação ${pontos}.`;
    case "frequencia_cardiaca":
      return `${rotulo} de ${valor} bpm — pontuação ${pontos}.`;
    case "nivel_consciencia":
      return `${rotulo}: ${valor ? "alerta" : "não alerta (confusão/voz/dor/irresponsivo)"} — pontuação ${pontos}.`;
    default:
      return `${rotulo}: pontuação ${pontos}.`;
  }
}

function pontuarLeitura(parametro: ParametroId, valor: number | boolean): number {
  switch (parametro) {
    case "frequencia_respiratoria":
      return pontuarFrequenciaRespiratoria(valor as number);
    case "saturacao_oxigenio":
      return pontuarSaturacaoOxigenio(valor as number);
    case "uso_oxigenio_suplementar":
      return pontuarUsoOxigenioSuplementar(valor as boolean);
    case "temperatura":
      return pontuarTemperatura(valor as number);
    case "pressao_arterial_sistolica":
      return pontuarPressaoSistolica(valor as number);
    case "frequencia_cardiaca":
      return pontuarFrequenciaCardiaca(valor as number);
    case "nivel_consciencia":
      return pontuarNivelConsciencia(valor as boolean);
    default:
      return 0;
  }
}

const UNIDADES: Partial<Record<ParametroId, string>> = {
  frequencia_respiratoria: "irpm",
  saturacao_oxigenio: "%",
  temperatura: "°C",
  pressao_arterial_sistolica: "mmHg",
  frequencia_cardiaca: "bpm",
};

/**
 * Monta uma `AvaliacaoPaciente` a partir de leituras sintéticas.
 * Política fail-closed desta fatia: 2+ insumos ausentes/inválidos, OU
 * qualquer insumo inválido isolado, tornam a avaliação `nao_avaliada`
 * (escore/banda `null`) — nunca um número computado silenciosamente a
 * partir de dados incompletos além desse limite (HAZ-0005/DOM-0004).
 */
function montarAvaliacao(
  leiturasPresentes: LeituraSintetica[],
  parametrosAusentes: ParametroId[],
  calculadoEm: string | null,
): AvaliacaoPaciente {
  const contribuicoesPresentes: ContribuicaoParametro[] = leiturasPresentes.map((leitura) => {
    const pontos = pontuarLeitura(leitura.parametro, leitura.valor);
    return {
      parametro: leitura.parametro,
      rotulo: ROTULO_PARAMETRO[leitura.parametro],
      valorObservado:
        typeof leitura.valor === "boolean" ? (leitura.valor ? "sim" : "não") : leitura.valor,
      unidade: UNIDADES[leitura.parametro],
      pontos,
      frescor: leitura.frescor,
      horarioFonte: leitura.horarioFonte,
      explicacao: explicacaoParametro(leitura.parametro, leitura.valor, pontos),
    };
  });

  const contribuicoesAusentes: ContribuicaoParametro[] = parametrosAusentes.map((parametro) => ({
    parametro,
    rotulo: ROTULO_PARAMETRO[parametro],
    valorObservado: null,
    pontos: null,
    frescor: "ausente",
    horarioFonte: null,
    // P1 (ADR-0029): nunca redigido como "normal" — insumo ausente é sempre declarado.
    explicacao: `${ROTULO_PARAMETRO[parametro]}: sem leitura registrada — insumo ausente, declarado explicitamente (não computado como normal).`,
  }));

  const insumosVelhos = leiturasPresentes
    .filter((l) => l.frescor === "envelhecendo" || l.frescor === "desatualizado")
    .map((l) => l.parametro);

  const contribuicoes = [...contribuicoesPresentes, ...contribuicoesAusentes];
  const algumParametroPontuouMaximo = contribuicoesPresentes.some((c) => c.pontos === 3);

  if (parametrosAusentes.length >= 2) {
    return {
      estadoAvaliacao: "nao_avaliada",
      news2Total: null,
      bandaRisco: null,
      contribuicoes,
      insumosAusentes: parametrosAusentes,
      insumosVelhos,
      // O dublê imita a FORMA do racional que a API real produz (razões
      // codificadas de ADR-0008 N3 + explicação agregada), para que a tela
      // exercite o mesmo caminho de renderização. O conteúdo é sintético e
      // rotulado como tal — nunca terminologia clínica ratificada.
      motivos: parametrosAusentes.map((p) => `missing_required_input:${p}`),
      anotacoes: [
        "SYNTH — ausência de escore não significa normalidade (HAZ-0005); verifique o paciente.",
      ],
      explicacao:
        "NEWS2 não avaliado: insumos obrigatórios ausentes. A ausência de pontuação não " +
        "significa normalidade.",
      parametroVermelho: algumParametroPontuouMaximo,
      calculadoEm: null,
      versaoRegra: VERSAO_REGRA_NEWS2_ILUSTRATIVA,
    };
  }

  const total = somarPontos(contribuicoesPresentes.map((c) => c.pontos));
  const bandaRisco = calcularBandaRisco(total, algumParametroPontuouMaximo);
  const estadoAvaliacao = parametrosAusentes.length === 1 ? "parcial" : "valida";

  return {
    estadoAvaliacao,
    news2Total: total,
    bandaRisco,
    contribuicoes,
    insumosAusentes: parametrosAusentes,
    insumosVelhos,
    motivos: parametrosAusentes.map((p) => `missing_required_input:${p}`),
    anotacoes:
      estadoAvaliacao === "parcial"
        ? ["SYNTH — avaliação parcial: um insumo obrigatório está ausente e está declarado abaixo."]
        : [],
    explicacao: `SYNTH — escore composto por ${contribuicoesPresentes.length} parâmetro(s) com leitura registrada.`,
    parametroVermelho: algumParametroPontuouMaximo,
    calculadoEm,
    versaoRegra: VERSAO_REGRA_NEWS2_ILUSTRATIVA,
  };
}

/**
 * Leitos SEM alertas embutidos — os alertas vivem em uma única lista
 * (`alertasSinteticos`), fonte única de verdade para mutação por
 * `reconhecerAlerta` (ver `../api/clienteMock.ts`, que compõe
 * `{ ...leitoBase, alertas: alertas.filter(...) }` a cada leitura, para
 * que reconhecer um alerta se reflita imediatamente na próxima consulta
 * à grade sem duplicar o mesmo objeto em dois lugares divergentes).
 */
function leitosSinteticosSemAlertas(): Array<Omit<ItemGradeLeito, "alertas">> {
  return [
    {
      leitoId: "Leito 01",
      pacienteRef: gerarPsrSintetico("A1"),
      pacienteApelido: "Paciente SYNTH-A1",
      avaliacao: montarAvaliacao(
        [
          {
            parametro: "frequencia_respiratoria",
            valor: 16,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "saturacao_oxigenio",
            valor: 98,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "uso_oxigenio_suplementar",
            valor: false,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "temperatura",
            valor: 36.8,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "pressao_arterial_sistolica",
            valor: 118,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "frequencia_cardiaca",
            valor: 78,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "nivel_consciencia",
            valor: true,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
        ],
        [],
        AGORA_SINTETICO,
      ),
    },
    {
      leitoId: "Leito 02",
      pacienteRef: gerarPsrSintetico("B2"),
      pacienteApelido: "Paciente SYNTH-B2",
      avaliacao: montarAvaliacao(
        [
          {
            parametro: "frequencia_respiratoria",
            valor: 24,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "saturacao_oxigenio",
            valor: 93,
            horarioFonte: "2026-08-16T11:40:00Z",
            frescor: "envelhecendo",
          },
          {
            parametro: "uso_oxigenio_suplementar",
            valor: true,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "temperatura",
            valor: 38.6,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "pressao_arterial_sistolica",
            valor: 95,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "frequencia_cardiaca",
            valor: 118,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "nivel_consciencia",
            valor: true,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
        ],
        [],
        AGORA_SINTETICO,
      ),
    },
    {
      leitoId: "Leito 03",
      pacienteRef: gerarPsrSintetico("C3"),
      pacienteApelido: "Paciente SYNTH-C3",
      avaliacao: montarAvaliacao(
        [
          {
            parametro: "frequencia_respiratoria",
            valor: 22,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "saturacao_oxigenio",
            valor: 94,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "uso_oxigenio_suplementar",
            valor: true,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "temperatura",
            valor: 37.2,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "pressao_arterial_sistolica",
            valor: 108,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "frequencia_cardiaca",
            valor: 92,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
        ],
        ["nivel_consciencia"],
        AGORA_SINTETICO,
      ),
    },
    {
      leitoId: "Leito 04",
      pacienteRef: gerarPsrSintetico("D4"),
      pacienteApelido: "Paciente SYNTH-D4",
      avaliacao: montarAvaliacao(
        [
          {
            parametro: "frequencia_respiratoria",
            valor: 18,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "temperatura",
            valor: 37.0,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "pressao_arterial_sistolica",
            valor: 112,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "frequencia_cardiaca",
            valor: 84,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
          {
            parametro: "nivel_consciencia",
            valor: true,
            horarioFonte: AGORA_SINTETICO,
            frescor: "atual",
          },
        ],
        // Dois insumos ausentes -> fail-closed (nao_avaliada), nunca "sem risco".
        ["saturacao_oxigenio", "uso_oxigenio_suplementar"],
        null,
      ),
    },
    {
      leitoId: "Leito 05",
      pacienteRef: gerarPsrSintetico("E5"),
      pacienteApelido: "Paciente SYNTH-E5",
      avaliacao: {
        ...montarAvaliacao(
          [
            {
              parametro: "frequencia_respiratoria",
              valor: 28,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "saturacao_oxigenio",
              valor: 89,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "uso_oxigenio_suplementar",
              valor: true,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "temperatura",
              valor: 39.4,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "pressao_arterial_sistolica",
              valor: 84,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "frequencia_cardiaca",
              valor: 138,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
            {
              parametro: "nivel_consciencia",
              valor: false,
              horarioFonte: "2026-08-16T08:00:00Z",
              frescor: "desatualizado",
            },
          ],
          [],
          "2026-08-16T08:00:00Z",
        ),
        // Avaliação inteira desatualizada: escore ainda exibido (transparência), mas com aviso — nunca escondido.
        estadoAvaliacao: "desatualizada",
      },
    },
    {
      leitoId: "Leito 06",
      pacienteRef: null,
      pacienteApelido: null,
      avaliacao: null,
    },
  ];
}

function alertasSinteticos(): Alerta[] {
  return [
    {
      alertaId: "SYNTH-ALERTA-0001",
      leitoId: "Leito 02",
      pacienteRef: gerarPsrSintetico("B2"),
      severidade: "alto",
      descricao: "NEWS2 em faixa de risco alto — reavaliação sugerida.",
      criadoEm: "2026-08-16T11:45:00Z",
      estado: "nao_atribuido",
      versao: 0,
    },
    {
      alertaId: "SYNTH-ALERTA-0002",
      leitoId: "Leito 05",
      pacienteRef: gerarPsrSintetico("E5"),
      severidade: "critico",
      descricao: "NEWS2 em faixa de risco crítico, com dado de origem desatualizado.",
      criadoEm: "2026-08-16T08:05:00Z",
      estado: "escalado",
      versao: 1,
    },
    {
      alertaId: "SYNTH-ALERTA-0003",
      leitoId: "Leito 01",
      pacienteRef: gerarPsrSintetico("A1"),
      severidade: "baixo",
      descricao: "Verificação de rotina concluída sem novos achados.",
      criadoEm: "2026-08-16T09:00:00Z",
      estado: "resolvido",
      versao: 2,
      reconhecidoPor: "SYNTH-PROFISSIONAL-01",
      reconhecidoEm: "2026-08-16T09:05:00Z",
    },
  ];
}

/** Ponto único de acesso aos dados sintéticos (mantidos em memória por chamada). */
export function criarDadosSinteticos(): {
  leitosBase: Array<Omit<ItemGradeLeito, "alertas">>;
  alertas: Alerta[];
} {
  return { leitosBase: leitosSinteticosSemAlertas(), alertas: alertasSinteticos() };
}

/** Compõe um leito completo (com seus alertas) a partir da base + da lista de alertas atual. */
export function compor(
  leitoBase: Omit<ItemGradeLeito, "alertas">,
  alertas: Alerta[],
): ItemGradeLeito {
  return {
    ...leitoBase,
    alertas: alertas.filter((alerta) => alerta.leitoId === leitoBase.leitoId),
  };
}
