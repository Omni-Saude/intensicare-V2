/**
 * Testes de aceite da PROJEÇÃO PUBLICÁVEL do modo de despacho (LAC-L2;
 * QAS-0023 — "degradações sem representação visível ao usuário: zero").
 *
 * Todos afirmam VALORES, não existência. O ponto do arquivo é provar, por
 * TENTATIVA e não por leitura, que nenhum caminho — despacho real, registro
 * forjado ou linha persistida adulterada — publica `acionavel: true` sobre
 * artefato sem cadeia de assinatura. Estado factual preservado: 0 vias
 * clínicas acionáveis; 47/47 inelegíveis.
 *
 * Todo dado é sintético (prefixo `SYNTH-`).
 */
import { SYNTHETIC_CONCEPTS } from "@intensicare/fixtures-sinteticas";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import { describe, expect, it } from "vitest";
import { comporRegistroDeRegras } from "../composicao/regras.js";
import type { ConfiguracaoRuntime } from "../config/index.js";
import { BLOQUEIO_ASSINATURA_AUSENTE, type EstadoDeBundle, type PortaDeBundle } from "./bundle.js";
import {
  BLOQUEIO_PROVENIENCIA_NAO_ATESTADA,
  CAMPOS_PUBLICADOS_DO_REGISTRO,
  CAMPOS_RETIDOS_DO_REGISTRO,
  comModoDeDespacho,
  DespachoIncoerenteError,
  derivarAcionavel,
  lerModoDeDespacho,
  modoDeDespachoDoResultadoPersistido,
  PROVENIENCIA_NAO_ATESTADA,
  projetarModoDeDespacho,
  resultadoNews2Publicavel,
} from "./exposicao.js";
import { criarProvedorGcs, IDENTIDADE_GCS } from "./gcs.js";
import { despacharGcs, despacharNews2 } from "./index.js";
import { criarProvedorNews2, IDENTIDADE_NEWS2 } from "./news2.js";
import { RegistroDeRegras } from "./registro.js";
import {
  congelarRegistro,
  MOTIVO_RECUSA_PT,
  type ProvenienciaBundle,
  type RegistroDeAvaliacao,
  ROTULO_NAO_AVALIADO_PT,
  ROTULO_SOMBRA_PT,
} from "./tipos.js";

const AVALIACAO = "2026-08-16T12:00:00.000Z";
const OBS_TIME = "2026-08-16T11:58:00.000Z";
const CORRELACAO = "SYNTH-CORR-EXPOSICAO-0001";
const CONTEXTO = { instanteIso: AVALIACAO, correlacaoId: CORRELACAO } as const;

const TENANT = "SYNTH-TENANT-G7";
const ENCONTRO = "SYNTH-TENANT-G7-ENC-P002";

/**
 * Composição REAL do processo em perfil sintético. Só `classePerfil` é lido
 * por `comporRegistroDeRegras` (verificado em `../composicao/regras.ts`);
 * montar a configuração inteira aqui não acrescentaria cobertura e
 * acoplaria este teste ao esquema de configuração.
 */
function registroReal(): RegistroDeRegras {
  return comporRegistroDeRegras({
    config: { classePerfil: "sintetico" } as unknown as ConfiguracaoRuntime,
  }).registro;
}

function linha(
  concept: string,
  sourceValue: number | null,
  sourceUnit: string | null,
  sourceCode: string | null = null,
): ClinicalObservationRow {
  return {
    id: `SYNTH-OBS-${concept}`,
    tenantId: TENANT,
    encounterId: ENCONTRO,
    concept,
    sourceValue,
    sourceUnit,
    sourceCode,
    canonicalValue: null,
    canonicalUnit: null,
    quality: "valid",
    effectiveAt: { kind: "present", instant: { utc: OBS_TIME, offset: "+00:00" } },
  };
}

/** Série NEWS2 completa (deterioração T2 do cenário sintético G7). */
function serieNews2(): ClinicalObservationRow[] {
  return [
    linha(SYNTHETIC_CONCEPTS.respiratoryRate, 26, "rpm"),
    linha(SYNTHETIC_CONCEPTS.oxygenSaturation, 89, "%"),
    linha("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
    linha(SYNTHETIC_CONCEPTS.systolicBloodPressure, 92, "mmHg"),
    linha(SYNTHETIC_CONCEPTS.heartRate, 122, "bpm"),
    linha("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
    linha(SYNTHETIC_CONCEPTS.temperature, 38.3, "Cel"),
  ];
}

/** Série GCS completa, no MESMO encontro. */
function serieGcs(): ClinicalObservationRow[] {
  return [
    linha("SYNTH-CONCEPT-GCS-EYE", 4, "{score}"),
    linha("SYNTH-CONCEPT-GCS-VERBAL", 5, "{score}"),
    linha("SYNTH-CONCEPT-GCS-MOTOR", 6, "{score}"),
    linha("SYNTH-CONCEPT-RASS", 0, "1"),
  ];
}

const INSUMO_NEWS2 = { observacoes: serieNews2(), contexto: { idadeAnos: 62 } } as const;

// ---------------------------------------------------------------------------
// 1. Despacho real do NEWS2: SOMBRA, NÃO acionável — valores afirmados
// ---------------------------------------------------------------------------

describe("modo de despacho do NEWS2 sobre o bundle real (não assinado)", () => {
  it("expõe modo 'sombra', acionavel false e o rótulo pt-BR, com a proveniência que explica o porquê", () => {
    const despacho = despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO);
    expect(despacho.tipo).toBe("avaliada");

    const exposto = projetarModoDeDespacho(despacho.registro);

    expect(exposto.desfecho).toBe("avaliada");
    expect(exposto.modo).toBe("sombra");
    expect(exposto.acionavel).toBe(false);
    expect(exposto.rotuloPt).toBe(ROTULO_SOMBRA_PT);
    expect(exposto.motivoRecusa).toBeNull();
    expect(exposto.mensagemRecusaPt).toBeNull();
    expect(exposto.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    expect(exposto.despachadoEm).toBe(AVALIACAO);

    // A proveniência é o QUE PROVA a não acionabilidade: sem cadeia de
    // assinatura (ADR-0007 C5 aberta) e com onze bloqueios de prontidão.
    expect(exposto.bundle.assinatura).toBe("assinatura_ausente");
    expect(exposto.bundle.versaoBundle).toBe("0.2.0");
    expect(exposto.bundle.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(exposto.bundle.bloqueiosDeAtivacao).toContain(BLOQUEIO_ASSINATURA_AUSENTE);
    expect(exposto.bundle.bloqueiosDeAtivacao.length).toBeGreaterThanOrEqual(6);
  });

  it("a avaliação em sombra continua sendo computada — o que muda é o rótulo, não a regra", () => {
    const despacho = despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO);
    const publicavel = resultadoNews2Publicavel(despacho);

    expect(publicavel.status).toBe("valido");
    expect(publicavel.escore).toBe(11);
    expect(publicavel.banda).toBe("critico");
    expect(publicavel.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    // …e ela viaja explicitamente rotulada como não acionável.
    expect(publicavel.despacho.modo).toBe("sombra");
    expect(publicavel.despacho.acionavel).toBe(false);
    expect(publicavel.despacho.versaoRegra).toBe(publicavel.versaoRegra);
  });
});

// ---------------------------------------------------------------------------
// 2. Recusa do GCS: motivo codificado legível na estrutura exposta
// ---------------------------------------------------------------------------

describe("modo de despacho do GCS (sem artefato de bundle)", () => {
  it("expõe desfecho 'nao_avaliada' com motivo codificado e mensagem pt-BR visível", () => {
    const despacho = despacharGcs(
      registroReal(),
      { observacoes: serieGcs(), contexto: { idadeAnos: 62 } },
      CONTEXTO,
    );
    expect(despacho.tipo).toBe("nao_avaliada");

    const exposto = projetarModoDeDespacho(despacho.registro);

    expect(exposto.desfecho).toBe("nao_avaliada");
    expect(exposto.motivoRecusa).toBe("bundle_ausente");
    expect(exposto.mensagemRecusaPt).toBe(MOTIVO_RECUSA_PT.bundle_ausente);
    expect(exposto.mensagemRecusaPt).toContain("Isto não significa ausência de risco");
    expect(exposto.rotuloPt).toBe(ROTULO_NAO_AVALIADO_PT);
    expect(exposto.modo).toBeNull();
    expect(exposto.acionavel).toBe(false);
    expect(exposto.versaoRegra).toBe("RULE-GCS@0.2.0");
    expect(exposto.bundle.assinatura).toBe("sem_bundle");
    expect(exposto.bundle.behaviorHash).toBeNull();
  });

  it("a recusa do NEWS2 também sai publicável, com escore null (HAZ-0005) e o motivo visível", () => {
    // Perfil endurecido: a composição instala porta que RECUSA (não há
    // carregador de bundle assinado neste repositório).
    const registro = comporRegistroDeRegras({
      config: { classePerfil: "produtivo" } as unknown as ConfiguracaoRuntime,
    }).registro;
    const publicavel = resultadoNews2Publicavel(despacharNews2(registro, INSUMO_NEWS2, CONTEXTO));

    expect(publicavel.status).toBe("indisponivel");
    expect(publicavel.escore).toBeNull();
    expect(publicavel.banda).toBeNull();
    expect(publicavel.despacho.desfecho).toBe("nao_avaliada");
    expect(publicavel.despacho.motivoRecusa).toBe("bundle_ausente");
    expect(publicavel.despacho.acionavel).toBe(false);
    expect(publicavel.despacho.modo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Não promoção — provada por TENTATIVA
// ---------------------------------------------------------------------------

function provenienciaNaoAssinada(): ProvenienciaBundle {
  return {
    versaoBundle: "0.2.0",
    digestManifesto: null,
    behaviorHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    assinatura: "assinatura_ausente",
    autorKeyId: null,
    aprovadorKeyId: null,
    bloqueiosDeAtivacao: [BLOQUEIO_ASSINATURA_AUSENTE],
    ativoDesde: "1970-01-01T00:00:00.000Z",
  };
}

function registroForjado(sobrescritas: Partial<RegistroDeAvaliacao>): RegistroDeAvaliacao {
  return congelarRegistro({
    correlacaoId: CORRELACAO,
    chaveRegra: "RULE-NEWS2@0.2.0",
    ruleId: "RULE-NEWS2",
    ruleVersion: "0.2.0",
    despachadoEm: AVALIACAO,
    desfecho: "avaliada",
    motivoRecusa: null,
    mensagemRecusaPt: null,
    modo: "sombra",
    acionavel: false,
    rotuloPt: ROTULO_SOMBRA_PT,
    bundle: provenienciaNaoAssinada(),
    entradas: { total: 0, digest: "sha256:0" },
    razoes: [],
    ...sobrescritas,
  });
}

/** Porta FORJADA que declara o artefato não assinado como `acionavel`. */
function portaForjadaAcionavel(): PortaDeBundle {
  const estado: EstadoDeBundle = {
    tipo: "disponivel",
    modo: "acionavel",
    proveniencia: provenienciaNaoAssinada(),
  };
  return { identidade: IDENTIDADE_NEWS2, estadoEm: () => estado };
}

describe("não promoção: nenhum caminho torna 'acionavel' verdadeiro sem assinatura", () => {
  it("registro forjado que DECLARA acionavel=true é recusado pela projeção, não saneado em silêncio", () => {
    const forjado = registroForjado({ acionavel: true, modo: "acionavel" });
    expect(() => projetarModoDeDespacho(forjado)).toThrow(DespachoIncoerenteError);
    expect(() => projetarModoDeDespacho(forjado)).toThrow(
      /acionavel declarado true, derivado false/,
    );
  });

  it("modo 'acionavel' com assinatura ausente NÃO basta: a projeção deriva acionavel=false", () => {
    const exposto = projetarModoDeDespacho(
      registroForjado({ modo: "acionavel", acionavel: false }),
    );
    expect(exposto.modo).toBe("acionavel");
    expect(exposto.acionavel).toBe(false);
  });

  it("porta forjada que ativa o artefato não assinado em modo acionável: despacho real sai NÃO acionável", () => {
    const registro = new RegistroDeRegras();
    registro.registrar(criarProvedorNews2({ porta: portaForjadaAcionavel() }));
    const despacho = despacharNews2(registro, INSUMO_NEWS2, CONTEXTO);

    // O motor é recusado antes (hash forjado não bate) — e mesmo se batesse,
    // a derivação continuaria falsa por causa da assinatura ausente.
    const exposto = projetarModoDeDespacho(despacho.registro);
    expect(exposto.acionavel).toBe(false);
  });

  it("linha persistida ADULTERADA (acionavel=true) é lida como 'sem modo registrado', nunca como acionável", () => {
    const adulterada = {
      desfecho: "avaliada",
      modo: "acionavel",
      acionavel: true,
      rotuloPt: ROTULO_SOMBRA_PT,
      motivoRecusa: null,
      mensagemRecusaPt: null,
      versaoRegra: "RULE-NEWS2@0.2.0",
      despachadoEm: AVALIACAO,
      bundle: {
        versaoBundle: "0.2.0",
        digestManifesto: null,
        behaviorHash: null,
        assinatura: "assinatura_ausente",
        bloqueiosDeAtivacao: [BLOQUEIO_ASSINATURA_AUSENTE],
        ativoDesde: null,
      },
    };
    expect(lerModoDeDespacho(adulterada)).toBeNull();
  });

  it("a regra de acionabilidade é cumulativa e permanece a do kernel de despacho — tabela verdade", () => {
    const semBloqueio: string[] = [];
    const comBloqueio = [BLOQUEIO_ASSINATURA_AUSENTE];
    const b = (
      assinatura: "assinatura_verificada" | "assinatura_ausente" | "sem_bundle",
      bloqueios: string[],
    ) => ({
      versaoBundle: null,
      digestManifesto: null,
      behaviorHash: null,
      assinatura,
      bloqueiosDeAtivacao: bloqueios,
      ativoDesde: null,
    });

    expect(derivarAcionavel(b("assinatura_ausente", semBloqueio), "acionavel")).toBe(false);
    expect(derivarAcionavel(b("sem_bundle", semBloqueio), "acionavel")).toBe(false);
    expect(derivarAcionavel(b("assinatura_verificada", comBloqueio), "acionavel")).toBe(false);
    expect(derivarAcionavel(b("assinatura_verificada", semBloqueio), "sombra")).toBe(false);
    expect(derivarAcionavel(b("assinatura_verificada", semBloqueio), null)).toBe(false);
    // Única combinação verdadeira — inalcançável hoje: exige custódia de chave
    // (ADR-0007 C5) e zero bloqueios de prontidão no manifesto real.
    expect(derivarAcionavel(b("assinatura_verificada", semBloqueio), "acionavel")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Ausência de PHI e de identificador de sujeito
// ---------------------------------------------------------------------------

describe("superfície publicada não carrega PHI nem identificador de sujeito", () => {
  it("as chaves publicadas são exatamente a lista fechada — nada escapa por espalhamento", () => {
    const exposto = projetarModoDeDespacho(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO).registro,
    );

    expect(Object.keys(exposto).sort()).toEqual(
      [
        "acionavel",
        "bundle",
        "desfecho",
        "despachadoEm",
        "mensagemRecusaPt",
        "modo",
        "motivoRecusa",
        "rotuloPt",
        "versaoRegra",
      ].sort(),
    );
    expect(Object.keys(exposto.bundle).sort()).toEqual(
      [
        "ativoDesde",
        "assinatura",
        "behaviorHash",
        "bloqueiosDeAtivacao",
        "digestManifesto",
        "versaoBundle",
      ].sort(),
    );
  });

  it("o texto serializado não contém tenant, encontro, observação, correlação nem digest de entradas", () => {
    const despacho = despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO);
    const serializado = JSON.stringify(resultadoNews2Publicavel(despacho).despacho);

    for (const proibido of [
      TENANT,
      ENCONTRO,
      "SYNTH-OBS-",
      CORRELACAO,
      despacho.registro.entradas.digest,
    ]) {
      expect(serializado).not.toContain(proibido);
    }
    expect(serializado).not.toContain("autorKeyId");
    expect(serializado).not.toContain("aprovadorKeyId");
  });

  it("todo campo do registro imutável está classificado como publicado ou retido", () => {
    const registro = despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO).registro;
    const classificados = [...CAMPOS_PUBLICADOS_DO_REGISTRO, ...CAMPOS_RETIDOS_DO_REGISTRO].sort();

    // Campo novo no registro reprova aqui até alguém decidir se ele pode ser
    // publicado — nenhum campo entra na superfície por omissão.
    expect(Object.keys(registro).sort()).toEqual(classificados);
    expect(new Set(classificados).size).toBe(classificados.length);
  });
});

// ---------------------------------------------------------------------------
// 5. Coexistência NEWS2 × GCS no mesmo encontro, sem contaminação
// ---------------------------------------------------------------------------

describe("coexistência NEWS2 × GCS no mesmo encontro", () => {
  it("produz dois envelopes independentes, com versão de regra distinta e sem campo de um no outro", () => {
    const registro = registroReal();
    const observacoes = [...serieNews2(), ...serieGcs()];

    const news2 = projetarModoDeDespacho(
      despacharNews2(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO).registro,
    );
    const gcs = projetarModoDeDespacho(
      despacharGcs(registro, { observacoes, contexto: { idadeAnos: 62 } }, CONTEXTO).registro,
    );

    expect(news2.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    expect(gcs.versaoRegra).toBe("RULE-GCS@0.2.0");
    expect(news2.versaoRegra).not.toBe(gcs.versaoRegra);

    // Nenhum campo do artefato do NEWS2 aparece no envelope do GCS.
    expect(news2.bundle.behaviorHash).not.toBeNull();
    expect(gcs.bundle.behaviorHash).toBeNull();
    expect(gcs.bundle.versaoBundle).toBeNull();
    expect(gcs.bundle.bloqueiosDeAtivacao).toEqual([]);

    // …e o desfecho de um não altera o do outro.
    expect(news2.desfecho).toBe("avaliada");
    expect(gcs.desfecho).toBe("nao_avaliada");
    expect(news2.motivoRecusa).toBeNull();
    expect(gcs.motivoRecusa).toBe("bundle_ausente");
  });

  it("o envelope é o MESMO para qualquer regra e não toca o resultado que acompanha", () => {
    const registro = new RegistroDeRegras();
    registro.registrar(criarProvedorGcs({ porta: portaGcsAusente() }));
    const despacho = despacharGcs(
      registro,
      { observacoes: serieGcs(), contexto: { idadeAnos: 62 } },
      CONTEXTO,
    );

    // Resultado sintético de forma ARBITRÁRIA: o envelope não interpreta o
    // que acompanha — só acrescenta `despacho`.
    const acompanhado = comModoDeDespacho({ campoDeOutraRegra: 42 } as const, despacho.registro);
    expect(acompanhado.campoDeOutraRegra).toBe(42);
    expect(acompanhado.despacho.versaoRegra).toBe("RULE-GCS@0.2.0");
    expect(acompanhado.despacho.acionavel).toBe(false);
  });
});

function portaGcsAusente(): PortaDeBundle {
  const estado: EstadoDeBundle = {
    tipo: "recusado",
    motivo: "bundle_ausente",
    detalhes: ["SYNTH — porta de teste sem artefato"],
    proveniencia: {
      versaoBundle: null,
      digestManifesto: null,
      behaviorHash: null,
      assinatura: "sem_bundle",
      autorKeyId: null,
      aprovadorKeyId: null,
      bloqueiosDeAtivacao: [],
      ativoDesde: null,
    },
  };
  return { identidade: IDENTIDADE_GCS, estadoEm: () => estado };
}

// ---------------------------------------------------------------------------
// 6. Ida e volta pelo armazenamento (é assim que a rota de leitura o obtém)
// ---------------------------------------------------------------------------

describe("leitura do envelope já persistido", () => {
  it("sobrevive a JSON.stringify/parse e é recuperado do `result` gravado", () => {
    const publicavel = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    );
    const persistido = JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;

    const relido = modoDeDespachoDoResultadoPersistido(persistido);
    expect(relido).not.toBeNull();
    expect(relido?.modo).toBe("sombra");
    expect(relido?.acionavel).toBe(false);
    expect(relido?.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    expect(relido?.rotuloPt).toBe(publicavel.despacho.rotuloPt);
    expect(relido?.desfecho).toBe(publicavel.despacho.desfecho);

    // A asserção anterior era `toEqual(publicavel.despacho)` — igualdade
    // INTEIRA, inclusive a proveniência. Ela deixou de valer de propósito
    // (ACHADO 4): esta leitura é SEM autoridade, e sem autoridade não há
    // proveniência publicável. O envelope continua legível; o que ele NÃO faz
    // mais é descrever um artefato que este runtime não atestou.
    expect(relido?.bundle).toEqual(PROVENIENCIA_NAO_ATESTADA);
    expect(relido?.bundle.behaviorHash).toBeNull();
    // Não-vacuidade: o registro legítimo TINHA proveniência a vazar.
    expect(publicavel.despacho.bundle.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(publicavel.despacho.bundle.assinatura).toBe("assinatura_ausente");
  });

  it("COM autoridade, a proveniência publicada é a do runtime — a supressão é do ramo sem autoridade", () => {
    const publicavel = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    );
    const persistido = JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;

    const relido = modoDeDespachoDoResultadoPersistido(persistido, {
      catalogo: registroReal(),
      instanteIso: AVALIACAO,
    });
    expect(relido).not.toBeNull();
    expect(relido?.bundle.assinatura).toBe("assinatura_ausente");
    expect(relido?.bundle.behaviorHash).toBe(publicavel.despacho.bundle.behaviorHash);
    expect(relido?.bundle.bloqueiosDeAtivacao).toContain(BLOQUEIO_ASSINATURA_AUSENTE);
    // …e não é o marcador de "não atestada".
    expect(relido?.bundle.bloqueiosDeAtivacao).not.toContain(BLOQUEIO_PROVENIENCIA_NAO_ATESTADA);
  });

  it("linha antiga (sem o campo) ou forma inválida ⇒ null, que o contrato define como NÃO acionável", () => {
    expect(modoDeDespachoDoResultadoPersistido({ status: "valido" })).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido(null)).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido(undefined)).toBeNull();
    expect(lerModoDeDespacho({ desfecho: "qualquer_coisa" })).toBeNull();
    expect(lerModoDeDespacho("texto")).toBeNull();
    expect(
      lerModoDeDespacho({
        desfecho: "nao_avaliada",
        modo: null,
        acionavel: false,
        rotuloPt: ROTULO_NAO_AVALIADO_PT,
        motivoRecusa: "motivo_que_nao_existe",
        mensagemRecusaPt: null,
        versaoRegra: "RULE-NEWS2@0.2.0",
        despachadoEm: AVALIACAO,
        bundle: { assinatura: "sem_bundle", bloqueiosDeAtivacao: [] },
      }),
    ).toBeNull();
  });
});
