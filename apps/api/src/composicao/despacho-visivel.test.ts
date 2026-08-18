/**
 * apps/api/src/composicao/despacho-visivel.test.ts — a degradação atravessa
 * a fronteira HTTP (QAS-0023: "count of degradations with no user-visible
 * representation: must be zero").
 *
 * O QUE ESTE ARQUIVO PROVA
 * -----------------------
 * O registro imutável de despacho (`apps/api/src/regras/`) é computado e
 * gravado no outbox como `regra-despachada`, mas até esta composição existir
 * ele NÃO aparecia em nenhuma resposta HTTP: quem olha a tela não tinha como
 * saber que a avaliação é SOMBRA e NÃO é acionável. O único sinal indireto
 * era `/v1/readyz` em 503 — que não é representação da degradação, é sintoma
 * de outra coisa.
 *
 * Aqui a asserção é sobre a RESPOSTA REAL do servidor montado por
 * `buildServer`, com PGlite real, kernel NEWS2 real e registro de regras
 * real — não sobre a projeção isolada (isso já é coberto por
 * `regras/exposicao.test.ts`).
 *
 * O QUE ESTE ARQUIVO NÃO ADMITE
 * -----------------------------
 * 1. `acionavel: true` em resposta alguma. O artefato local não tem cadeia de
 *    assinatura (ADR-0007 C5 aberta) e `acionavel` é DERIVADO, nunca copiado.
 *    Estado factual imutável: 0 vias clínicas acionáveis; 47/47 inelegíveis.
 * 2. PHI, identificador de sujeito ou alça de correlação dentro do envelope.
 *    `correlacaoId`, `entradas` e `razoes` ficam RETIDOS no registro durável
 *    do outbox (trilha interna) — ver `CAMPOS_RETIDOS_DO_REGISTRO`.
 * 3. Verde vácuo: cada asserção de ausência é precedida de âncora de
 *    presença (coleção não vazia, leito encontrado, envelope presente).
 *
 * Rastreio: QAS-0023, ADR-0007 (C5 aberta), ADR-0008 §8.3, ADR-0011 P1/P2,
 * ADR-0020 O5, HAZ-0005, LAC-L2.
 */

import type { PGlite } from "@electric-sql/pglite";
import type {
  AvaliacoesPacienteResposta,
  GradeLeitosResposta,
  IngestaoObservacoesResposta,
  ModoDeDespachoAvaliacao,
} from "@intensicare/contratos";
import { buildG7SyntheticScenario, loadIntoDatabase } from "@intensicare/fixtures-sinteticas";
import { bootstrapDatabase, createInMemoryDatabase } from "@intensicare/persistencia";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "../auth.js";
import { buildServer } from "../index.js";
import { CAMPOS_PUBLICADOS_DO_REGISTRO, CAMPOS_RETIDOS_DO_REGISTRO } from "../regras/index.js";

const cenario = buildG7SyntheticScenario();
const TENANT = cenario.organization.id;
const P002 = cenario.patients[1]!;
const ENC_P002 = cenario.encounters[1]!;
const ATOR = "SYNTH-MEDICO-DESPACHO";
const AUTH = { authorization: `Bearer ${gerarTokenSintetico(TENANT, ATOR)}` };

/** Leito de `cenario.beds` que nenhum encontro ativo ocupa — ramo "sem avaliação". */
const LEITO_VAZIO = cenario.beds[3]!.id;

const FIXTURE_MAX_MS = Date.parse("2026-08-16T11:30:00.000Z");
let contadorTempoClinico = 0;
function tempoClinicoFresco(): string {
  contadorTempoClinico += 1;
  return new Date(
    Math.max(Date.now(), FIXTURE_MAX_MS) + contadorTempoClinico * 60_000,
  ).toISOString();
}

function serieCompleta(t: string) {
  return [
    { parametro: "FR", valor: 26, unidade: "rpm", coletadoEm: t },
    { parametro: "SpO2", valor: 89, unidade: "%", coletadoEm: t },
    { parametro: "FluxoO2", valor: 0, unidade: "L/min", coletadoEm: t },
    { parametro: "PAS", valor: 92, unidade: "mmHg", coletadoEm: t },
    { parametro: "FC", valor: 122, unidade: "bpm", coletadoEm: t },
    { parametro: "NivelConsciencia", codigo: "A", coletadoEm: t },
    { parametro: "Temperatura", valor: 38.3, unidade: "Cel", coletadoEm: t },
  ];
}

/**
 * Corpos CRUS de toda resposta que este arquivo obteve do servidor. É sobre
 * eles — e não sobre objetos já desserializados e filtrados — que a
 * não-promoção ponta a ponta é afirmada: um `acionavel: true` escondido em
 * qualquer nível de aninhamento aparece no texto.
 */
const corposObservados: { rotulo: string; texto: string }[] = [];

function registrar(rotulo: string, texto: string): string {
  corposObservados.push({ rotulo, texto });
  return texto;
}

describe("composição: o MODO DE DESPACHO atravessa a fronteira HTTP (QAS-0023)", () => {
  let db: PGlite;
  let app: FastifyInstance;

  beforeAll(async () => {
    db = createInMemoryDatabase();
    await bootstrapDatabase(db);
    await loadIntoDatabase(db);
    app = await buildServer({ db });

    const ingestao = await app.inject({
      method: "POST",
      url: "/v1/ingestao/observacoes",
      headers: { ...AUTH, "idempotency-key": "SYNTH-IDEM-DESPACHO-VISIVEL" },
      payload: {
        encontroId: ENC_P002.id,
        leitoId: ENC_P002.bedId,
        pacienteRef: P002.subjectRef,
        contexto: { idadeAnos: 62 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      },
    });
    expect(ingestao.statusCode).toBe(201);
    registrar("POST /v1/ingestao/observacoes", ingestao.body);
    // Âncora de não-vacuidade da semeadura: sem avaliação computada, todas as
    // asserções abaixo estariam medindo um banco sem fato nenhum.
    expect((ingestao.json() as IngestaoObservacoesResposta).avaliacao.status).toBe("valido");
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe("1. GET /v1/pacientes/{ref}/avaliacoes publica o envelope", () => {
    it("devolve `despacho` com modo 'sombra' e acionavel false — os VALORES, não só a forma", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH,
      });
      expect(resposta.statusCode).toBe(200);
      registrar("GET /v1/pacientes/{ref}/avaliacoes", resposta.body);

      const corpo = resposta.json() as AvaliacoesPacienteResposta;
      // NÃO VACUIDADE: sem avaliação alguma, o `for` abaixo não asseveraria nada.
      expect(corpo.avaliacoes.length).toBeGreaterThan(0);

      for (const avaliacao of corpo.avaliacoes) {
        const despacho = avaliacao.despacho;
        expect(despacho, "toda avaliação publicada carrega o modo de despacho").toBeDefined();
        expect(despacho).not.toBeNull();
        const d = despacho as ModoDeDespachoAvaliacao;
        expect(d.modo).toBe("sombra");
        expect(d.acionavel).toBe(false);
        expect(d.desfecho).toBe("avaliada");
        expect(d.versaoRegra).toBe("RULE-NEWS2@0.2.0");
        expect(d.versaoRegra).toBe(avaliacao.versaoRegra);
        // O rótulo pt-BR é o que a tela mostra: precisa existir e dizer algo.
        expect(d.rotuloPt.length).toBeGreaterThan(0);
        // A degradação estrutural fica LEGÍVEL: artefato sem cadeia de
        // assinatura (ADR-0007 C5 aberta) e bloqueio de ativação nomeado.
        expect(d.bundle.assinatura).toBe("assinatura_ausente");
        expect(d.bundle.bloqueiosDeAtivacao).toContain("assinatura_ausente_adr0007_c5");
      }
    });

    it("o envelope publica exatamente os campos classificados como publicáveis", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH,
      });
      const corpo = resposta.json() as AvaliacoesPacienteResposta;
      const despacho = corpo.avaliacoes[0]?.despacho as ModoDeDespachoAvaliacao | undefined;
      expect(despacho).toBeDefined();

      expect(Object.keys(despacho as object).sort()).toEqual(
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
      expect(Object.keys((despacho as ModoDeDespachoAvaliacao).bundle).sort()).toEqual(
        [
          "ativoDesde",
          "assinatura",
          "behaviorHash",
          "bloqueiosDeAtivacao",
          "digestManifesto",
          "versaoBundle",
        ].sort(),
      );
      // Guarda de não-vacuidade das duas listas de classificação: se alguém
      // esvaziar `CAMPOS_RETIDOS_DO_REGISTRO`, o teste de PHI abaixo passaria
      // sem verificar campo nenhum.
      expect(CAMPOS_RETIDOS_DO_REGISTRO.length).toBeGreaterThan(0);
      expect(CAMPOS_PUBLICADOS_DO_REGISTRO.length).toBeGreaterThan(0);
    });
  });

  describe("2. GET /v1/projecoes/grade-leitos publica o modo por linha", () => {
    it("leito COM avaliação traz `modoAvaliacao`; leito SEM avaliação traz `null`", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH,
      });
      expect(resposta.statusCode).toBe(200);
      registrar("GET /v1/projecoes/grade-leitos", resposta.body);

      const grade = resposta.json() as GradeLeitosResposta;
      // NÃO VACUIDADE (exigência 5 do despacho): grade vazia satisfaria por
      // omissão qualquer asserção feita com `find(...)?.`.
      expect(grade.leitos.length).toBeGreaterThan(0);

      const comAvaliacao = grade.leitos.find((l) => l.leitoId === ENC_P002.bedId);
      expect(comAvaliacao, "o leito semeado precisa estar na grade").toBeDefined();
      expect(comAvaliacao?.statusAvaliacao).toBe("valido");
      const modo = comAvaliacao?.modoAvaliacao;
      expect(modo).toBeDefined();
      expect(modo).not.toBeNull();
      expect((modo as ModoDeDespachoAvaliacao).modo).toBe("sombra");
      expect((modo as ModoDeDespachoAvaliacao).acionavel).toBe(false);
      expect((modo as ModoDeDespachoAvaliacao).bundle.assinatura).toBe("assinatura_ausente");

      const semAvaliacao = grade.leitos.find((l) => l.leitoId === LEITO_VAZIO);
      expect(semAvaliacao, "o leito desocupado precisa estar na grade").toBeDefined();
      expect(semAvaliacao?.statusAvaliacao).toBeNull();
      // `null` — e não `undefined` por esquecimento: o contrato define `null`
      // como "modo NÃO registrado ⇒ linha NÃO acionável".
      expect(semAvaliacao?.modoAvaliacao).toBeNull();
    });
  });

  describe("3. não-promoção ponta a ponta", () => {
    it("nenhuma resposta HTTP deste perfil jamais traz `acionavel: true`", async () => {
      // NÃO VACUIDADE: a varredura precisa ter o que varrer, e precisa haver
      // ao menos uma ocorrência de `acionavel` — senão "nenhum true" seria
      // verdade por o campo simplesmente não existir.
      expect(corposObservados.length).toBeGreaterThanOrEqual(3);
      const comCampo = corposObservados.filter((c) => c.texto.includes('"acionavel"'));
      expect(comCampo.length).toBeGreaterThan(0);

      for (const { rotulo, texto } of corposObservados) {
        expect(texto, `${rotulo} publicou acionabilidade`).not.toContain('"acionavel":true');
        expect(texto, `${rotulo} publicou acionabilidade`).not.toContain('"acionavel": true');
      }
    });

    it("o modo de despacho não altera o veredito clínico: escore e banda seguem os do kernel", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH,
      });
      const corpo = resposta.json() as AvaliacoesPacienteResposta;
      const avaliacao = corpo.avaliacoes[0];
      expect(avaliacao).toBeDefined();
      expect(avaliacao?.status).toBe("valido");
      expect(avaliacao?.escore).toBe(11);
      expect(avaliacao?.banda).toBe("critico");
    });
  });

  describe("4. ausência de PHI no envelope que atravessa a rota", () => {
    it("o envelope não carrega sujeito, encontro, leito, tenant nem alça de correlação", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
        headers: AUTH,
      });
      const corpo = resposta.json() as AvaliacoesPacienteResposta;
      expect(corpo.avaliacoes.length).toBeGreaterThan(0);

      for (const avaliacao of corpo.avaliacoes) {
        const despacho = avaliacao.despacho;
        expect(despacho).toBeDefined();
        const serializado = JSON.stringify(despacho);
        // Âncora: o envelope não é vazio — sem isto "não contém X" é trivial.
        expect(serializado.length).toBeGreaterThan(50);
        expect(serializado).toContain("sombra");

        for (const identificador of [
          P002.subjectRef,
          P002.id,
          ENC_P002.id,
          ENC_P002.bedId,
          TENANT,
          ATOR,
        ]) {
          expect(serializado, `envelope vazou "${identificador}"`).not.toContain(identificador);
        }

        // Campos deliberadamente RETIDOS no registro durável do outbox.
        for (const campo of CAMPOS_RETIDOS_DO_REGISTRO) {
          expect(
            Object.hasOwn(despacho as object, campo),
            `campo retido "${String(campo)}" foi publicado`,
          ).toBe(false);
        }
      }
    });

    it("o envelope da grade de leitos obedece à mesma retenção", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/projecoes/grade-leitos",
        headers: AUTH,
      });
      const grade = resposta.json() as GradeLeitosResposta;
      expect(grade.leitos.length).toBeGreaterThan(0);

      const linhas = grade.leitos.filter(
        (l) => l.modoAvaliacao !== null && l.modoAvaliacao !== undefined,
      );
      // NÃO VACUIDADE: ao menos uma linha precisa ter envelope.
      expect(linhas.length).toBeGreaterThan(0);

      for (const linha of linhas) {
        const serializado = JSON.stringify(linha.modoAvaliacao);
        expect(serializado).toContain("sombra");
        for (const identificador of [P002.subjectRef, ENC_P002.id, TENANT, ATOR]) {
          expect(serializado, `modoAvaliacao vazou "${identificador}"`).not.toContain(
            identificador,
          );
        }
        for (const campo of CAMPOS_RETIDOS_DO_REGISTRO) {
          expect(
            Object.hasOwn(linha.modoAvaliacao as object, campo),
            `campo retido "${String(campo)}" foi publicado na grade`,
          ).toBe(false);
        }
      }
    });
  });
});
