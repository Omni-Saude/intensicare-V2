import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type AvaliacoesPacienteResposta,
  CODIGOS_RAZAO_PRONTIDAO,
  type CodigoRazaoProntidao,
  type EntradaGradeLeitos,
  type EstadoAssinaturaBundle,
  type EstadoItemTrabalho,
  type EventoFluxo,
  type GradeLeitosResposta,
  type HealthzResposta,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  IF_MATCH_HEADER,
  type IngestaoObservacoesRequisicao,
  type IngestaoObservacoesResposta,
  type ItemTrabalho,
  type ModoDeDespachoAvaliacao,
  type ModoDespachoRegra,
  type MotivoRecusaDespacho,
  type ObservacaoEmQuarentena,
  PROBLEM_JSON_MIME_TYPE,
  type ProblemDetails,
  type ProblemDetailsConflitoVersao,
  type ProvenienciaBundlePublicada,
  packageVersion,
  type RazaoDeProntidao,
  type ReconhecerAlertaRequisicao,
  type ReconhecerAlertaResposta,
  type RelatorioProntidao,
  type ResultadoAvaliacao,
  type VereditoProntidao,
} from "./index.js";

// Caminho do YAML relativo a este arquivo de teste (packages/contratos/src/../openapi.yaml).
const openapiPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));

describe("@intensicare/contratos (fundação executável)", () => {
  it("exporta uma versão de pacote não vazia", () => {
    expect(packageVersion).toBe("0.0.0");
  });

  it("declara as convenções mínimas de erro, idempotência e concorrência", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
    expect(IDEMPOTENCY_REPLAYED_HEADER).toBe("Idempotency-Replayed");
    expect(IF_MATCH_HEADER).toBe("If-Match");
    expect(PROBLEM_JSON_MIME_TYPE).toBe("application/problem+json");

    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Erro de exemplo",
      status: 500,
    };
    expect(problem.status).toBe(500);
  });
});

describe("tipos do contrato SPR-G7-2 (checagem de forma em tempo de compilação + amostra em runtime)", () => {
  it("ProblemDetailsConflitoVersao carrega versão e estado corrente para redecisão (ADR-0009 W3)", () => {
    const conflito: ProblemDetailsConflitoVersao = {
      type: "about:blank",
      title: "Conflito de versão",
      status: 412,
      versaoAtual: 3,
      estadoAtual: "reconhecido",
    };
    expect(conflito.versaoAtual).toBe(3);
  });

  it("IngestaoObservacoesRequisicao/Resposta usam apenas referências sintéticas (SYNTH-)", () => {
    const requisicao: IngestaoObservacoesRequisicao = {
      encontroId: "SYNTH-ENC-0001",
      leitoId: "SYNTH-LEITO-01",
      pacienteRef: "SYNTH-PSR-0001",
      observacoes: [
        { parametro: "FC", valor: 118, unidade: "bpm", coletadoEm: "2026-08-16T12:00:00Z" },
      ],
    };
    expect(requisicao.pacienteRef.startsWith("SYNTH-")).toBe(true);

    const quarentena: ObservacaoEmQuarentena = {
      entrada: { parametro: "desconhecido" },
      motivo: "parâmetro fora do catálogo aceito",
    };
    expect(quarentena.motivo.length).toBeGreaterThan(0);
  });

  /**
   * O nome anterior ("ResultadoAvaliacao nunca produz escore/banda quando
   * status != 'valido'") prometia uma garantia de COMPORTAMENTO do motor
   * clínico. `packages/contratos` não tem nenhuma lógica de regra para
   * exercitar — o corpo abaixo apenas constrói um literal escolhido pelo
   * PRÓPRIO teste, com `escore: null, banda: null` explícitos, e confere que
   * esses dois campos — recém-escritos duas linhas acima — são `null`. Isso
   * não pode falhar para nenhum valor de `status`, correto ou errado: é
   * checagem de FORMA (o tipo TS permite `null` aqui; se o campo virasse
   * obrigatório e não-nulo, este arquivo não compilaria), não de motor. A
   * garantia real, contra o kernel NEWS2 de verdade, está em
   * `apps/api/src/avaliacao.test.ts` ("SpO2 ausente → indisponivel com razão
   * explícita; escore/banda null; JAMAIS parcial").
   */
  it("o TIPO ResultadoAvaliacao permite escore/banda nulos quando status != 'valido' (forma — o motor real é avaliacao.test.ts)", () => {
    const avaliacaoIndisponivel: ResultadoAvaliacao = {
      status: "indisponivel",
      parametrosAusentes: ["FC", "PAS", "SpO2"],
      parametros: [
        {
          parametro: "FC",
          presente: false,
          statusParametro: "missing",
          motivo: "missing_required_input:pulse",
        },
        {
          parametro: "PAS",
          presente: false,
          statusParametro: "missing",
          motivo: "missing_required_input:sbp",
        },
        {
          parametro: "SpO2",
          presente: false,
          statusParametro: "missing",
          motivo: "missing_required_input:spo2",
        },
      ],
      escore: null,
      banda: null,
      avaliadoEm: "2026-08-16T12:00:00Z",
      motivos: [
        "missing_required_input:pulse",
        "missing_required_input:sbp",
        "missing_required_input:spo2",
      ],
      anotacoes: [],
      explicacao:
        "NEWS2 não avaliado — insumos obrigatórios ausentes; ausência nunca significa normalidade.",
      parametroVermelho: false,
      versaoRegra: "RULE-NEWS2@0.2.0",
    };
    expect(avaliacaoIndisponivel.escore).toBeNull();
    expect(avaliacaoIndisponivel.banda).toBeNull();
  });

  it("StatusAvaliacao espelha os cinco estados da ADR-0008 — 'parcial' reservado (inalcançável para NEWS2, N-8)", () => {
    const estados: ResultadoAvaliacao["status"][] = [
      "valido",
      "parcial",
      "indisponivel",
      "desatualizado",
      "invalido",
    ];
    expect(estados).toHaveLength(5);
  });

  it("EstadoItemTrabalho cobre os oito estados nucleares do ADR-0009 W1", () => {
    const estados: EstadoItemTrabalho[] = [
      "nao-atribuido",
      "atribuido",
      "reconhecido",
      "escalado",
      "sobreposto",
      "resolvido",
      "suprimido",
      "reaberto",
    ];
    expect(estados).toHaveLength(8);
  });

  it("ItemTrabalho e ReconhecerAlertaRequisicao/Resposta compõem coerentemente", () => {
    const item: ItemTrabalho = {
      id: "SYNTH-ALERTA-0001",
      estado: "reconhecido",
      versao: 2,
      tenantId: "SYNTH-TENANT-A",
      encontroId: "SYNTH-ENC-0001",
      leitoId: "SYNTH-LEITO-01",
      pacienteRef: "SYNTH-PSR-0001",
      escore: 7,
      banda: "alerta",
      motivo: "escore acima do limiar ilustrativo",
      criadoEm: "2026-08-16T12:00:00Z",
      atualizadoEm: "2026-08-16T12:05:00Z",
      reconhecidoPor: "SYNTH-USER-01",
      reconhecidoEm: "2026-08-16T12:05:00Z",
    };
    const requisicao: ReconhecerAlertaRequisicao = { comentario: "ciência registrada" };
    const resposta: ReconhecerAlertaResposta = { item };
    expect(resposta.item.versao).toBe(2);
    expect(requisicao.comentario).toBeDefined();
  });

  it("GradeLeitosResposta/EntradaGradeLeitos representam leito sem avaliação sem inventar normal", () => {
    const entradaSemAvaliacao: EntradaGradeLeitos = {
      leitoId: "SYNTH-LEITO-02",
      encontroId: null,
      pacienteRef: null,
      escore: null,
      banda: null,
      statusAvaliacao: null,
      frescor: "desatualizado",
      atualizadoEm: null,
      alerta: null,
    };
    const grade: GradeLeitosResposta = { leitos: [entradaSemAvaliacao] };
    expect(grade.leitos[0]?.banda).toBeNull();
  });

  it("AvaliacoesPacienteResposta, EventoFluxo e HealthzResposta têm a forma esperada", () => {
    const avaliacoes: AvaliacoesPacienteResposta = {
      pacienteRef: "SYNTH-PSR-0001",
      avaliacoes: [],
    };
    const evento: EventoFluxo = {
      sequencia: 1,
      tipo: "alerta-criado",
      tenantId: "SYNTH-TENANT-A",
      ocorridoEm: "2026-08-16T12:00:00Z",
      dados: { id: "SYNTH-ALERTA-0001" },
    };
    const saude: HealthzResposta = { status: "ok" };
    expect(avaliacoes.avaliacoes).toEqual([]);
    expect(evento.sequencia).toBe(1);
    expect(saude.status).toBe("ok");
  });

  it("IngestaoObservacoesResposta compõe avaliação e alerta opcional", () => {
    const resposta: IngestaoObservacoesResposta = {
      encontroId: "SYNTH-ENC-0001",
      recebidoEm: "2026-08-16T12:00:00Z",
      aceitas: [],
      quarentena: [],
      avaliacao: {
        // "indisponivel" (não "parcial"): parcial é reservado a classes 2+
        // do ADR-0026 e é inalcançável para NEWS2 (N-8/GDEC-0007).
        status: "indisponivel",
        parametrosAusentes: ["PAS"],
        parametros: [],
        escore: null,
        banda: null,
        avaliadoEm: "2026-08-16T12:00:00Z",
        motivos: ["missing_required_input:sbp"],
        anotacoes: [],
        explicacao: "NEWS2 não avaliado — PAS ausente; ausência nunca significa normalidade.",
        parametroVermelho: false,
        versaoRegra: "RULE-NEWS2@0.2.0",
      },
      alerta: null,
    };
    expect(resposta.alerta).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Modo de despacho — o envelope que atravessa a fronteira HTTP
// ---------------------------------------------------------------------------

/** Proveniência de um despacho sem qualquer artefato de regra associado. */
const BUNDLE_INEXISTENTE: ProvenienciaBundlePublicada = {
  versaoBundle: null,
  digestManifesto: null,
  behaviorHash: null,
  assinatura: "sem_bundle",
  bloqueiosDeAtivacao: [],
  ativoDesde: null,
};

const DESPACHO_EM_SOMBRA: ModoDeDespachoAvaliacao = {
  desfecho: "avaliada",
  modo: "sombra",
  acionavel: false,
  rotuloPt:
    "SOMBRA — avaliação consultiva sobre dados sintéticos, NÃO acionável: nenhuma recomendação, ordem ou conduta clínica decorre deste resultado.",
  motivoRecusa: null,
  mensagemRecusaPt: null,
  versaoRegra: "RULE-NEWS2@0.2.0",
  despachadoEm: "2026-08-16T12:00:00.000Z",
  bundle: BUNDLE_INEXISTENTE,
};

describe("modo de despacho (QAS-0023 / ADR-0007 eixo 4 / ADR-0008 §8.3)", () => {
  it("o envelope de sombra é composível e NÃO é acionável", () => {
    expect(DESPACHO_EM_SOMBRA.acionavel).toBe(false);
    expect(DESPACHO_EM_SOMBRA.rotuloPt).toContain("NÃO acionável");
    expect(DESPACHO_EM_SOMBRA.bundle.assinatura).toBe("sem_bundle");
    // Estado factual: 0 vias clínicas acionáveis. Um envelope publicável só
    // poderia dizer `acionavel: true` com assinatura verificada, modo
    // acionável e zero bloqueios — e a derivação vive na API, não aqui.
    expect(DESPACHO_EM_SOMBRA.bundle.bloqueiosDeAtivacao).toEqual([]);
  });

  it("cobre a RECUSA, que é o ramo que mais fácil se esquece de rotular", () => {
    const recusado: ModoDeDespachoAvaliacao = {
      desfecho: "nao_avaliada",
      modo: null,
      acionavel: false,
      rotuloPt:
        "NÃO AVALIADO — nenhuma avaliação clínica foi produzida; a ausência de resultado não é ausência de risco.",
      motivoRecusa: "bundle_ausente",
      mensagemRecusaPt:
        "Não há pacote de regra (bundle) verificável para esta regra: as avaliações NÃO foram calculadas. Isto não significa ausência de risco.",
      versaoRegra: "RULE-GCS@0.1.0",
      despachadoEm: "2026-08-16T12:00:00.000Z",
      bundle: BUNDLE_INEXISTENTE,
    };
    expect(recusado.modo).toBeNull();
    expect(recusado.mensagemRecusaPt).not.toBeNull();
    expect(recusado.acionavel).toBe(false);
  });

  it("os enums de despacho têm valores e são fechados", () => {
    const modos: ModoDespachoRegra[] = ["sombra", "acionavel"];
    const assinaturas: EstadoAssinaturaBundle[] = [
      "assinatura_verificada",
      "assinatura_ausente",
      "sem_bundle",
    ];
    const motivos: MotivoRecusaDespacho[] = [
      "regra_nao_registrada",
      "bundle_ausente",
      "bundle_nao_verificado",
      "motor_divergente",
      "regra_nao_ativada",
      "regra_indisponivel",
    ];
    expect(modos).toHaveLength(2);
    expect(assinaturas).toHaveLength(3);
    expect(motivos).toHaveLength(6);
    expect(new Set(motivos).size).toBe(motivos.length);
  });

  it("ResultadoAvaliacao e EntradaGradeLeitos aceitam o envelope — e sobrevivem sem ele", () => {
    const comDespacho: ResultadoAvaliacao = {
      status: "indisponivel",
      parametrosAusentes: ["PAS"],
      parametros: [],
      escore: null,
      banda: null,
      avaliadoEm: "2026-08-16T12:00:00Z",
      motivos: ["missing_required_input:sbp"],
      anotacoes: [],
      explicacao: "NEWS2 não avaliado — PAS ausente; ausência nunca significa normalidade.",
      parametroVermelho: false,
      versaoRegra: "RULE-NEWS2@0.2.0",
      despacho: DESPACHO_EM_SOMBRA,
    };
    expect(comDespacho.despacho?.acionavel).toBe(false);

    const linha: EntradaGradeLeitos = {
      leitoId: "SYNTH-LEITO-03",
      encontroId: "SYNTH-ENC-0003",
      pacienteRef: "SYNTH-PSR-0003",
      escore: null,
      banda: null,
      statusAvaliacao: "indisponivel",
      frescor: "atual",
      atualizadoEm: "2026-08-16T12:00:00Z",
      alerta: null,
      modoAvaliacao: DESPACHO_EM_SOMBRA,
    };
    expect(linha.modoAvaliacao?.modo).toBe("sombra");

    // AUSENTE é um estado legítimo do formato (linha gravada antes desta
    // versão do contrato) — e, por contrato, NÃO acionável.
    const semDespacho: ResultadoAvaliacao = { ...comDespacho, despacho: undefined };
    const linhaSemModo: EntradaGradeLeitos = { ...linha, modoAvaliacao: null };
    expect(semDespacho.despacho).toBeUndefined();
    expect(linhaSemModo.modoAvaliacao).toBeNull();
  });

  it("a semântica 'ausente ou null ⇒ NÃO acionável' está no COMENTÁRIO do tipo, não no formato", () => {
    // O formato não consegue expressar isto (o campo é opcional de propósito:
    // torná-lo obrigatório quebraria literais existentes). Se a regra não
    // estiver escrita onde o consumidor lê, ela não existe — por isso este
    // teste guarda o texto normativo dos dois campos.
    const fonte = readFileSync(fileURLToPath(new URL("./index.ts", import.meta.url)), "utf-8");
    // A quebra de linha do comentário pode cair entre "ou" e "`null`".
    const ocorrencias = fonte.match(/ausente ou[\s*]+`null`/g) ?? [];
    expect(ocorrencias.length).toBeGreaterThanOrEqual(2);
    expect(fonte).toContain("DEVE tratar a avaliação\n   * como NÃO acionável");
  });
});

// ---------------------------------------------------------------------------
// Prontidão — o vocabulário que `apps/web` espelhava à mão (LAC-L3)
// ---------------------------------------------------------------------------

/**
 * Extrai a lista de valores de um enum YAML em bloco
 * (`Nome:` … `enum:` … `- valor`), preservando a ORDEM do documento.
 */
function enumEmBlocoDoYaml(conteudo: string, nomeSchema: string): string[] {
  const inicio = conteudo.indexOf(`\n    ${nomeSchema}:\n`);
  if (inicio === -1) return [];
  const resto = conteudo.slice(inicio + 1);
  const fim = resto.search(/\n {4}\w+:\n/);
  const bloco = fim === -1 ? resto : resto.slice(0, fim);
  const posEnum = bloco.indexOf("enum:");
  if (posEnum === -1) return [];
  return [...bloco.slice(posEnum).matchAll(/^\s+- ([a-z0-9_]+)$/gm)].map((m) => m[1] as string);
}

describe("prontidão (GET /v1/readyz) — SAF-0025 / QAS-0023", () => {
  const conteudoOpenapi = readFileSync(openapiPath, "utf-8");

  it("os sete códigos de razão são exatamente os do openapi.yaml, na mesma ordem", () => {
    const doYaml = enumEmBlocoDoYaml(conteudoOpenapi, "CodigoRazaoProntidao");
    expect(doYaml.length, "enum vazio — a comparação abaixo não provaria nada").toBeGreaterThan(0);
    expect([...CODIGOS_RAZAO_PRONTIDAO]).toEqual(doYaml);
    expect(new Set(CODIGOS_RAZAO_PRONTIDAO).size).toBe(CODIGOS_RAZAO_PRONTIDAO.length);
  });

  it("VereditoProntidao espelha o documento e não presume 'ready'", () => {
    const vereditos: VereditoProntidao[] = ["ready", "degraded", "not_ready"];
    expect(vereditos).toHaveLength(3);
    expect(conteudoOpenapi).toContain("enum: [ready, degraded, not_ready]");
  });

  it("RelatorioProntidao carrega razões codificadas e degradações exibidas", () => {
    const razao: RazaoDeProntidao = {
      codigo: "rule_bundle_unavailable",
      detalhe: "Nenhum pacote de regra verificável está ativo neste processo.",
    };
    const relatorio: RelatorioProntidao = {
      veredito: "not_ready",
      razoes: [razao],
      perfil: {
        somenteSintetico: true,
        declaracaoPt: "Processo opera exclusivamente sobre dados sintéticos (prefixo SYNTH-).",
      },
      degradacoes: [
        {
          modo: "regra_clinica_desligada",
          dominio: "rule",
          desdeMs: 0,
          mensagemUi: "Avaliação clínica indisponível — as avaliações NÃO foram calculadas.",
          comportamentoSeguro: "Nenhuma avaliação é publicada como válida.",
          fallbackManual: "Avaliação clínica à beira do leito, pelo processo habitual do serviço.",
          condicaoSaida: "Pacote de regra verificável e ativado.",
          exibidaEm: ["api_contract"],
        },
      ],
      // `null` = VALIDATION REQUIRED (Gate G1): nenhum alvo numérico de
      // frescor foi decidido, e nenhum é inventado aqui.
      limitesDeFrescorDeclarados: [{ projecao: "grade_leitos", limiteMs: null }],
    };
    expect(relatorio.veredito).toBe("not_ready");
    expect(relatorio.razoes[0]?.codigo).toBe("rule_bundle_unavailable");
    expect(relatorio.limitesDeFrescorDeclarados[0]?.limiteMs).toBeNull();
    expect(relatorio.degradacoes[0]?.exibidaEm).toContain("api_contract");
  });

  it("um código conhecido é reconhecível pela tupla, sem redigitá-la", () => {
    const codigo: CodigoRazaoProntidao = "projection_freshness_threshold_unvalidated";
    expect((CODIGOS_RAZAO_PRONTIDAO as readonly string[]).includes(codigo)).toBe(true);
    // A tupla RECONHECE; ela não filtra. Código desconhecido precisa APARECER
    // na tela (QAS-0023) — quem decide isso é o consumidor, não o contrato.
    expect((CODIGOS_RAZAO_PRONTIDAO as readonly string[]).includes("codigo_de_versao_futura")).toBe(
      false,
    );
  });
});

describe("openapi.yaml (contrato legível por humanos e por gerador)", () => {
  const conteudo = readFileSync(openapiPath, "utf-8");

  it("declara OpenAPI 3.1 e os cinco caminhos exigidos pela tarefa mais o fluxo de eventos", () => {
    expect(conteudo).toContain("openapi: 3.1.0");
    expect(conteudo).toContain("/v1/ingestao/observacoes:");
    expect(conteudo).toContain("/v1/projecoes/grade-leitos:");
    expect(conteudo).toContain("/v1/pacientes/{pacienteRef}/avaliacoes:");
    expect(conteudo).toContain("/v1/alertas/{id}/reconhecer:");
    expect(conteudo).toContain("/v1/healthz:");
    expect(conteudo).toContain("/v1/eventos/stream:");
  });

  it("usa problem+json e cabeçalhos de idempotência/concorrência em pt-BR", () => {
    expect(conteudo).toContain("application/problem+json");
    expect(conteudo).toContain("Idempotency-Key");
    expect(conteudo).toContain("If-Match");
  });

  it("não contém nenhuma referência de paciente fora do padrão sintético SYNTH-", () => {
    const referenciasPaciente = conteudo.match(/pacienteRef:\s*SYNTH-[A-Za-z0-9-]+/g) ?? [];
    expect(referenciasPaciente.length).toBeGreaterThan(0);
    // Nenhuma linha de exemplo usa "amh:psr:v1:" seguido de algo que não seja SYNTH-.
    expect(conteudo).not.toMatch(/amh:psr:v1:(?!SYNTH-)[0-9a-fA-F-]{20,}/);
  });
});
