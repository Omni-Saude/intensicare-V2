/**
 * Leitura da vigilância contra a persistência REAL (PGlite em memória,
 * migrado e rebaixado ao papel de aplicação, com RLS por tenant). Todos os
 * dados semeados aqui são 100% SINTÉTICOS (`SYNTH-`).
 */
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  insertAlert,
  insertBed,
  insertCareUnit,
  insertClinicalObservationWithOutbox,
  insertEncounter,
  insertEvaluationRecord,
  insertOrganization,
  insertPatientIdentity,
  withTenantTransaction,
} from "@intensicare/persistencia";
import { beforeAll, describe, expect, it } from "vitest";
import { PARAMETROS_DIA_CIVIL, utcLocal } from "./apoio-de-teste.js";
import { calcularCargaDeAlarmes } from "./carga-de-alarmes.js";
import { limiarDeInstrumentacao, perfilarInsumos, perfilarStatus } from "./deriva.js";
import { calcularKpir14, RECONHECIMENTO_DE_MONITORIZACAO, VARIANTES_MINIMAS } from "./kpir-14.js";
import {
  lerAlertas,
  lerAvaliacoes,
  lerEpisodiosDeUti,
  lerObservacoes,
  lerOcupacoes,
  MOTIVO_DISPOSICAO_NAO_REGISTRADA,
} from "./leitura.js";
import { criarJanela, POLITICA_DE_PARCIAL_CONSERVADORA } from "./tipos.js";
import { vigiarVersaoDeRegra } from "./versao-de-regra.js";

const TENANT = "SYNTH-TENANT-VIG";
const UNIDADE = `${TENANT}-UTI-01`;
const JANELA = criarJanela(utcLocal("2026-08-10", 0), utcLocal("2026-08-13", 0));

function instante(utc: string) {
  return { kind: "present" as const, instant: { utc, offset: "-03:00" } };
}

interface Lido {
  alertas: Awaited<ReturnType<typeof lerAlertas>>;
  ocupacoes: Awaited<ReturnType<typeof lerOcupacoes>>;
  avaliacoes: Awaited<ReturnType<typeof lerAvaliacoes>>;
  observacoes: Awaited<ReturnType<typeof lerObservacoes>>;
  episodios: Awaited<ReturnType<typeof lerEpisodiosDeUti>>;
}

let lido: Lido;

beforeAll(async () => {
  const db = createInMemoryDatabase();
  await bootstrapDatabase(db);

  await withTenantTransaction(db, TENANT, async (tx) => {
    await insertOrganization(tx, { id: TENANT, tenantId: TENANT, name: "Organização Sintética" });
    await insertCareUnit(tx, {
      id: UNIDADE,
      tenantId: TENANT,
      organizationId: TENANT,
      name: "UTI Sintética",
    });

    for (const n of [1, 2]) {
      const bedId = `${TENANT}-LEITO-0${n}`;
      const patientId = `${TENANT}-PAT-0${n}`;
      const encounterId = `${TENANT}-ENC-0${n}`;
      await insertBed(tx, { id: bedId, tenantId: TENANT, careUnitId: UNIDADE, code: `0${n}` });
      await insertPatientIdentity(tx, {
        id: patientId,
        tenantId: TENANT,
        subjectRef: `amh:psr:v1:SYNTH-${TENANT}-P0${n}`,
      });
      await insertEncounter(tx, {
        id: encounterId,
        tenantId: TENANT,
        patientId,
        bedId,
        admittedAt: instante(utcLocal("2026-08-10", 0)),
      });

      // Uma observação e uma avaliação válida por dia, e um alerta por dia.
      for (const [i, dia] of ["2026-08-10", "2026-08-11", "2026-08-12"].entries()) {
        await insertClinicalObservationWithOutbox(
          tx,
          {
            id: `SYNTH-OBS-${n}-${dia}`,
            tenantId: TENANT,
            subjectRef: `amh:psr:v1:SYNTH-${TENANT}-P0${n}`,
            encounterId,
            concept: "SYNTH-CONCEPT-HR",
            value: {
              sourceValue: 90 + i,
              sourceUnit: "bpm",
              canonicalValue: 90 + i,
              canonicalUnit: "/min",
            },
            quality: "valid",
            provenance: {
              sourceSystem: "SYNTH",
              sourceEnvelopeId: `SYNTH-ENV-${n}-${dia}`,
              transformation: "sintetico",
              mappingVersion: "0",
              collector: "teste-de-vigilancia",
            },
            observedAt: instante(utcLocal(dia, 12)),
            effectiveAt: instante(utcLocal(dia, 12)),
            issuedAt: instante(utcLocal(dia, 12)),
            receivedAt: instante(utcLocal(dia, 12)),
            persistedAt: instante(utcLocal(dia, 12)),
          },
          `encounter:${encounterId}`,
        );

        await insertEvaluationRecord(tx, {
          id: `SYNTH-AVAL-${n}-${dia}`,
          tenantId: TENANT,
          encounterId,
          subjectRef: `amh:psr:v1:SYNTH-${TENANT}-P0${n}`,
          status: "valido",
          totalScore: 3,
          riskTier: "atencao",
          redParameter: false,
          fires: true,
          evaluatedAt: instante(utcLocal(dia, 12)),
          result: { status: "valido", escore: 3 },
          // Versão de regra sobe no último dia — a mistura é deliberada.
          kernelRecord: {
            ruleId: "RULE-NEWS2",
            ruleVersion: dia === "2026-08-12" ? "0.3.0" : "0.2.0",
          },
          // Identidade durável (MAJ-5): as colunas precisam CONCORDAR com o
          // JSON que declara identidade — é o mesmo registro, uma vez no blob
          // e outra nas colunas.
          ruleId: "RULE-NEWS2",
          ruleVersion: dia === "2026-08-12" ? "0.3.0" : "0.2.0",
        });

        await insertAlert(tx, {
          id: `SYNTH-ALERTA-${n}-${dia}`,
          tenantId: TENANT,
          encounterId,
          raisedAt: instante(utcLocal(dia, 13)),
          evaluatedAt: instante(utcLocal(dia, 12)),
          severity: "atencao",
          reason: "escore sintético acima do limiar de exibição",
          score: 3,
        });
      }
    }
  });

  lido = await withTenantTransaction(db, TENANT, async (tx) => ({
    alertas: await lerAlertas(tx),
    ocupacoes: await lerOcupacoes(tx),
    avaliacoes: await lerAvaliacoes(tx),
    observacoes: await lerObservacoes(tx),
    episodios: await lerEpisodiosDeUti(tx),
  }));
});

describe("leitura sobre a persistência real", () => {
  it("lê alertas com unidade resolvida pelo leito e SEM versão de regra atribuída", () => {
    expect(lido.alertas).toHaveLength(6);
    for (const alerta of lido.alertas) {
      expect(alerta.unidadeId).toBe(UNIDADE);
      expect(alerta.instante.tipo).toBe("presente");
      expect(alerta.regra).toEqual({
        tipo: "ausente",
        motivo: "alerta-nao-carrega-atribuicao-de-versao-de-regra-no-esquema-atual",
      });
    }
  });

  it("lê ocupação em curso como 'em_curso', nunca como âncora ausente", () => {
    expect(lido.ocupacoes).toHaveLength(2);
    for (const ocupacao of lido.ocupacoes) {
      expect(ocupacao.admissao.tipo).toBe("presente");
      expect(ocupacao.fim.tipo).toBe("em_curso");
    }
  });

  it("lê avaliações com a versão de regra vinda de kernel_record", () => {
    expect(lido.avaliacoes).toHaveLength(6);
    const versoes = new Set(
      lido.avaliacoes.map((a) => (a.regra.tipo === "declarada" ? a.regra.ruleVersion : "ausente")),
    );
    expect([...versoes].sort()).toEqual(["0.2.0", "0.3.0"]);
  });
});

describe("carga de alarmes sobre o que está gravado", () => {
  it("computa a taxa por paciente-dia avaliado e declara o defeito de recorte por versão", () => {
    const carga = calcularCargaDeAlarmes({
      janela: JANELA,
      parametros: PARAMETROS_DIA_CIVIL,
      ocupacoes: lido.ocupacoes,
      avaliacoes: lido.avaliacoes,
      alertas: lido.alertas,
    });
    expect(carga.agregado.pacienteDiasOcupados).toBe(6);
    expect(carga.agregado.pacienteDiasAvaliados).toBe(6);
    expect(carga.agregado.alertasNoNumerador).toBe(6);
    expect(carga.agregado.taxa.tipo).toBe("computada");
    if (carga.agregado.taxa.tipo === "computada") {
      expect(carga.agregado.taxa.alertasPorPacienteDiaAvaliado).toBe(1);
    }
    expect(carga.porUnidade.map((u) => u.chave)).toEqual([UNIDADE]);
    // O esquema atual não atribui versão ao alerta — defeito DECLARADO.
    expect(carga.porVersaoDeRegra).toEqual([{ chave: "versao-de-regra-ausente", contagem: 6 }]);
    expect(carga.defeitosDeRelatorio).toHaveLength(1);
    // Supressão não é instrumentada pela persistência — distinto de zero.
    expect(carga.supressao.tipo).toBe("nao_instrumentada");
  });
});

describe("vigilância de versão sobre o que está gravado", () => {
  it("detecta a mistura 0.2.0 × 0.3.0 e aponta o instante de virada", () => {
    const vigilancia = vigiarVersaoDeRegra(JANELA, lido.avaliacoes);
    expect(vigilancia.misturaDeVersoes).toBe(true);
    expect(vigilancia.usos.map((u) => u.chave)).toEqual(["RULE-NEWS2@0.2.0", "RULE-NEWS2@0.3.0"]);
    expect(vigilancia.instanteDeViradaUtc).toBe(utcLocal("2026-08-12", 12));
    expect(vigilancia.achados.map((a) => a.id)).toContain("mistura-de-versoes-na-janela");
    // Sem impressão de conteúdo, o defeito E3 fica indetectável — lacuna declarada.
    expect(vigilancia.achados.map((a) => a.id)).toContain("impressao-de-conteudo-nao-registrada");
  });
});

describe("perfis de deriva sobre o que está gravado", () => {
  it("perfila insumos e status a partir das colunas reais", () => {
    const insumos = perfilarInsumos("janela-sintetica", JANELA, lido.observacoes);
    expect(insumos.total).toBe(6);
    expect(insumos.porQualidade).toEqual([{ chave: "valid", contagem: 6 }]);
    expect(insumos.porUnidadeCanonica).toEqual([{ chave: "/min", contagem: 6 }]);
    expect(insumos.semTempoClinico).toBe(0);

    const status = perfilarStatus(
      "janela-sintetica",
      JANELA,
      lido.avaliacoes,
      POLITICA_DE_PARCIAL_CONSERVADORA,
    );
    expect(status.total).toBe(6);
    expect(status.taxaNaoComputavel).toBe(0);
    // O limiar continua sendo um parâmetro declaradamente não ratificado.
    expect(limiarDeInstrumentacao(0.1, 5).proveniencia).toBe(
      "limiar-de-instrumentacao-nao-ratificado-AUTH-CLINSAFETY",
    );
  });
});

describe("KPIR-14 contra o esquema atual — falha fechada, não fabrica número", () => {
  it("todo episódio cai em DC(KPIR-14) porque a disposição de alta não é gravada", () => {
    const resultado = calcularKpir14({
      periodo: JANELA,
      episodios: lido.episodios,
      variantes: VARIANTES_MINIMAS,
    });
    expect(lido.episodios).toHaveLength(2);
    for (const episodio of lido.episodios) {
      expect(episodio.disposicao).toEqual({
        tipo: "ausente",
        motivo: MOTIVO_DISPOSICAO_NAO_REGISTRADA,
      });
      expect(episodio.ancoraDeAlta.tipo).toBe("ausente");
    }
    // Guarda de não-vacuidade, simétrica à de `lido.episodios` acima: as três
    // variantes de tratamento de transferência são o ponto do teste — sem
    // nenhuma, "todo episódio cai em DC(KPIR-14)" seria afirmado sem abrir
    // variante alguma.
    expect(resultado.variantes, "nenhuma variante KPIR-14 foi produzida").toHaveLength(3);
    for (const variante of resultado.variantes) {
      const aberta = variante.abrir(RECONHECIMENTO_DE_MONITORIZACAO);
      expect(aberta.altasVivas).toBe(0);
      expect(aberta.altasTotais).toBe(0);
      expect(aberta.obitos).toBe(0);
      expect(aberta.completude.elegiveis).toBe(2);
      expect(aberta.completude.computaveis).toBe(0);
      expect(aberta.completude.motivosDeExclusao).toEqual([
        {
          chave: "ancora-de-alta-ausente:encounters.discharged_at-nulo-ou-forma-nao-reconhecida",
          contagem: 2,
        },
      ]);
    }
  });
});
