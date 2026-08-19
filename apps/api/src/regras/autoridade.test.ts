/**
 * apps/api/src/regras/autoridade.test.ts — ACH-REV8-3: `acionavel` só é
 * publicável a partir de AUTORIDADE, nunca de COERÊNCIA interna do registro.
 *
 * O ACHADO, REPRODUZIDO ANTES DE QUALQUER EDIÇÃO
 * ----------------------------------------------
 * `lerModoDeDespacho` derivava `acionavel` de `ehAcionavel` aplicado à
 * proveniência LIDA DO PRÓPRIO REGISTRO. Registro e proveniência vêm do MESMO
 * blob — se o blob é controlado pelo atacante, os dois lados da comparação
 * também são. Os cinco vetores que existiam em `exposicao.test.ts` só forjavam
 * INCOMPETENTEMENTE (assinatura ausente, bloqueio presente); um blob que
 * declara `assinatura_verificada` + `bloqueiosDeAtivacao: []` + `modo:
 * "acionavel"` + `acionavel: true` é internamente coerente e passava.
 *
 * Reprodução OBSERVADA em 2026-08-18, contra `HEAD` `700b13e`, com PGlite real
 * e `buildServer` real (arquivo temporário, depois removido):
 *
 *   REPRO/unidade lerModoDeDespacho => {"desfecho":"avaliada","modo":"acionavel",
 *     "acionavel":true,"rotuloPt":"ACIONÁVEL — conduta clínica autorizada.",…}
 *   REPRO/HTTP grade modoAvaliacao  => {…"acionavel":true…}
 *   REPRO/HTTP avaliacoes body      => {…"acionavel":true…}
 *
 * O revisor está certo; a derivação anterior era checagem de COERÊNCIA, não de
 * AUTORIDADE. Uma nota lateral da reprodução: `evaluation_records` é append-only
 * (trigger de `0001_init.sql` recusa `UPDATE`), então o vetor real não é
 * adulterar a linha e sim INSERIR uma linha mais recente — as duas leituras
 * tomam a mais recente do encontro.
 *
 * O QUE ESTE ARQUIVO EXIGE
 * ------------------------
 * `acionavel` publicado é derivado do CATÁLOGO DE AUTORIDADE do runtime — o
 * conjunto de artefatos que ESTE processo carregou e cuja porta os reconhece
 * como disponíveis. O registro persistido serve de CHAVE DE JUNÇÃO
 * (`versaoRegra` + `versaoBundle` + `behaviorHash` + `digestManifesto`), nunca
 * de fonte da verdade. Sem autoridade que sustente a alegação, `acionavel` é
 * `false` — fail-closed por AUSÊNCIA DE AUTORIDADE, não por incoerência.
 *
 * O QUE ESTE ARQUIVO **NÃO** FECHA — `ACH-O3-1`, ABERTO
 * -----------------------------------------------------
 * O fecho do `ACH-REV8-3` cobre ACIONABILIDADE e ALEGAÇÃO DE AUTORIDADE. Ele
 * NÃO cobre a integridade do restante do `result` persistido: `escore`,
 * `banda`, `status`, `motivos`, `anotacoes` e `explicacao` vêm do mesmo blob
 * controlado pelo atacante e são republicados VERBATIM por
 * `resultadoPersistidoPublicavel` (a allow-list do ACHADO 1 fecha a injeção
 * ESTRUTURAL; o VALOR de cada campo conhecido segue aberto).
 *
 * ALCANCE MEDIDO — a descrição anterior o subdimensionava. Ela dizia "fabrica
 * UM ESCORE, só não fabrica uma RECOMENDAÇÃO ACIONÁVEL". Reproduzido na secção
 * 5 deste arquivo, é maior:
 * - OCULTA DETERIORAÇÃO: 11/`critico` do kernel é publicado como 0/`normal`
 *   com `status: "valido"` — sem nenhuma degradação de status que sinalize
 *   algo errado. Não é "mais um escore"; é o escore CERTO substituído pelo
 *   ERRADO na direção clinicamente perigosa;
 * - ESCREVE PROSA pt-BR NA TELA DO INTENSIVISTA: `explicacao`, `anotacoes` e
 *   `motivos` são RENDERIZADOS por `ExplicacaoDoBackend`
 *   (`apps/web/src/components/DetalhePaciente.tsx`). Texto normativo do
 *   atacante em superfície clínica (HAZ-0005). Isto não estava registrado.
 *
 * LIMITE DO QUE FOI MEDIDO AQUI, para não trocar um exagero por outro: a
 * GRADE de leitos toma `escore`/`banda`/`statusAvaliacao` das COLUNAS de
 * `evaluation_records`, não do blob — forjar só o blob NÃO move a grade
 * (asserido na secção 5). A substituição do ITEM DE TRABALHO (alerta da grade
 * e `POST /v1/alertas/{id}/reconhecer` devolvendo 200 sobre alerta forjado),
 * relatada por revisão adversarial, é de OUTRA tabela (`work_items`) e NÃO foi
 * reproduzida por este arquivo — não está afirmada aqui e precisa de achado
 * próprio.
 *
 * `ACH-O3-1` é identificador DOCUMENTO-LOCAL, atribuído pelo orquestrador,
 * pendente de ratificação em `docs/00-governance/traceability-policy.md` §1.1
 * (mesmo regime de `LAC-*`/`RLI-*`/`IA-*`; nenhum prefixo global novo — a
 * família `ACH-*` já existe). Está deliberadamente NÃO fechado aqui: fechá-lo
 * exige integridade do registro persistido (assinatura de linha, HMAC ou
 * coluna de digest), o que é desenho novo, toca `packages/persistencia` e
 * provavelmente depende da MESMA custódia de chave que a ADR-0007 C5 mantém
 * aberta. O último caso deste arquivo o torna VISÍVEL por asserção — um teste
 * que prova o fecho parcial e cala o que ficou aberto é meia verdade.
 *
 * Nada aqui torna via clínica alguma acionável: estado factual preservado —
 * 0 vias acionáveis, 47/47 inelegíveis, ADR-0007 C5 ABERTA. Todo dado é
 * sintético (prefixo `SYNTH-`).
 *
 * Rastreio: ACH-REV8-3 (fechado), ACH-REV8-3-A (fechado), ACH-O3-1 (ABERTO),
 * ADR-0007 (eixos 2/3/4/5; C5 aberta), ADR-0008 §8.3, QAS-0023, HAZ-0005,
 * LAC-L2.
 */
import type { PGlite } from "@electric-sql/pglite";
import type { AvaliacoesPacienteResposta, GradeLeitosResposta } from "@intensicare/contratos";
import {
  buildG7SyntheticScenario,
  loadIntoDatabase,
  SYNTHETIC_CONCEPTS,
} from "@intensicare/fixtures-sinteticas";
import {
  createClinicalRuleSwitchboard,
  createInMemoryTelemetry,
} from "@intensicare/observabilidade";
import type { ClinicalObservationRow } from "@intensicare/persistencia";
import {
  bootstrapDatabase,
  createInMemoryDatabase,
  withTenantTransaction,
} from "@intensicare/persistencia";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gerarTokenSintetico } from "../auth.js";
import { comporRegistroDeRegras } from "../composicao/regras.js";
import type { ConfiguracaoRuntime } from "../config/index.js";
import { buildServer } from "../index.js";
import {
  FORMA_DOS_CAMPOS_DA_CONTRIBUICAO,
  FORMA_DOS_CAMPOS_DO_RESULTADO,
  lerModoDeDespacho,
  modoDeDespachoDoResultadoPersistido,
  PROVENIENCIA_NAO_ATESTADA,
  resultadoNews2Publicavel,
  resultadoPersistidoPublicavel,
} from "./exposicao.js";
import { despacharNews2 } from "./index.js";
import type { RegistroDeRegras } from "./registro.js";
import { MOTIVO_RECUSA_PT, ROTULO_NAO_AVALIADO_PT, ROTULO_SOMBRA_PT } from "./tipos.js";

const AVALIACAO = "2026-08-16T12:00:00.000Z";
const OBS_TIME = "2026-08-16T11:58:00.000Z";
const CONTEXTO = { instanteIso: AVALIACAO, correlacaoId: "SYNTH-CORR-AUTORIDADE-0001" } as const;

function registroReal(): RegistroDeRegras {
  return comporRegistroDeRegras({
    config: { classePerfil: "sintetico" } as unknown as ConfiguracaoRuntime,
  }).registro;
}

/** Autoridade de leitura ancorada no registro REAL do processo. */
function autoridadeReal(registro: RegistroDeRegras = registroReal()) {
  return { catalogo: registro, instanteIso: AVALIACAO } as const;
}

function linha(
  concept: string,
  sourceValue: number | null,
  sourceUnit: string | null,
  sourceCode: string | null = null,
): ClinicalObservationRow {
  return {
    id: `SYNTH-OBS-${concept}`,
    tenantId: "SYNTH-TENANT-G7",
    encounterId: "SYNTH-TENANT-G7-ENC-P002",
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

const INSUMO_NEWS2 = {
  observacoes: [
    linha(SYNTHETIC_CONCEPTS.respiratoryRate, 26, "rpm"),
    linha(SYNTHETIC_CONCEPTS.oxygenSaturation, 89, "%"),
    linha("SYNTH-CONCEPT-O2-FLOW", 0, "L/min"),
    linha(SYNTHETIC_CONCEPTS.systolicBloodPressure, 92, "mmHg"),
    linha(SYNTHETIC_CONCEPTS.heartRate, 122, "bpm"),
    linha("SYNTH-CONCEPT-CONSCIOUSNESS", null, null, "A"),
    linha(SYNTHETIC_CONCEPTS.temperature, 38.3, "Cel"),
  ],
  contexto: { idadeAnos: 62 },
} as const;

/**
 * FORJA COMPETENTE — o vetor que o achado descreve e que nenhum dos cinco
 * vetores anteriores exercitava. Todos os campos são internamente COERENTES
 * segundo `ehAcionavel`: assinatura verificada, zero bloqueios, modo
 * `acionavel`, `acionavel: true`. Nenhuma autoridade os produziu; são texto.
 */
const FORJA_COMPETENTE = Object.freeze({
  desfecho: "avaliada",
  modo: "acionavel",
  acionavel: true,
  rotuloPt: "ACIONÁVEL — conduta clínica autorizada.",
  motivoRecusa: null,
  mensagemRecusaPt: null,
  versaoRegra: "RULE-NEWS2@0.2.0",
  despachadoEm: AVALIACAO,
  bundle: Object.freeze({
    versaoBundle: "0.2.0",
    digestManifesto: `sha256:${"a".repeat(64)}`,
    behaviorHash: `sha256:${"b".repeat(64)}`,
    assinatura: "assinatura_verificada",
    bloqueiosDeAtivacao: Object.freeze([]),
    ativoDesde: "2026-01-01T00:00:00.000Z",
  }),
});

// ---------------------------------------------------------------------------
// 1. O vetor COMPETENTE é recusado — com e sem autoridade em mãos
// ---------------------------------------------------------------------------

describe("ACH-REV8-3: forja competente não publica acionabilidade", () => {
  it("SEM autoridade: um registro que declara acionavel=true é fabricado — leitura devolve null", () => {
    // Sem catálogo de autoridade não há de ONDE derivar acionabilidade.
    // Publicar o blob (mesmo com `acionavel` reescrito para false) lavaria a
    // linha forjada; `null` é a leitura honesta e o contrato já a define como
    // "modo NÃO registrado ⇒ NÃO acionável".
    expect(lerModoDeDespacho(FORJA_COMPETENTE)).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido({ despacho: FORJA_COMPETENTE })).toBeNull();
  });

  it("COM autoridade real: o artefato alegado não é o que o runtime carregou — null", () => {
    // O runtime carregou RULE-NEWS2@0.2.0 SEM cadeia de assinatura (ADR-0007
    // C5 aberta) e com bloqueios; o `behaviorHash` real também não é o forjado.
    expect(lerModoDeDespacho(FORJA_COMPETENTE, autoridadeReal())).toBeNull();
  });

  it("a alegação NÃO é aceita nem quando a chave de junção é copiada do runtime", () => {
    // Vetor mais forte: o atacante lê o `behaviorHash`/versão reais (são
    // públicos na resposta HTTP) e os copia, mudando SÓ assinatura, bloqueios
    // e modo. A autoridade continua dizendo `assinatura_ausente` + bloqueios.
    const legitimo = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    ).despacho;

    const forjaComChaveReal = {
      ...FORJA_COMPETENTE,
      bundle: {
        ...FORJA_COMPETENTE.bundle,
        versaoBundle: legitimo.bundle.versaoBundle,
        behaviorHash: legitimo.bundle.behaviorHash,
        digestManifesto: legitimo.bundle.digestManifesto,
      },
    };
    // Âncora de não-vacuidade: a chave copiada é mesmo a do runtime.
    expect(forjaComChaveReal.bundle.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);

    expect(lerModoDeDespacho(forjaComChaveReal, autoridadeReal())).toBeNull();
  });

  it("regra que o runtime não conhece: nenhuma autoridade, nenhuma publicação", () => {
    const outraRegra = { ...FORJA_COMPETENTE, versaoRegra: "RULE-DESCONHECIDA@9.9.9" };
    expect(lerModoDeDespacho(outraRegra, autoridadeReal())).toBeNull();
    // …e o mesmo vale para um registro NÃO acionável de regra desconhecida:
    // sem autoridade não há proveniência a publicar.
    const naoAcionavel = { ...outraRegra, acionavel: false, modo: "sombra" as const };
    expect(lerModoDeDespacho(naoAcionavel, autoridadeReal())).toBeNull();
  });

  it("LAVAGEM DE AUTORIDADE: exibir cadeia verificada sem quem a sustente também é recusado", () => {
    // Classe vizinha e mais sutil: o atacante desiste de `acionavel: true` e
    // fica com a APARÊNCIA — cadeia de assinatura verificada e/ou modo
    // acionável na tela, com `acionavel: false`. Não é acionabilidade, mas é
    // uma alegação de autoridade que ninguém emitiu.
    const soAparencia = { ...FORJA_COMPETENTE, acionavel: false };
    expect(lerModoDeDespacho(soAparencia)).toBeNull();
    expect(lerModoDeDespacho(soAparencia, autoridadeReal())).toBeNull();

    const soAssinatura = { ...FORJA_COMPETENTE, acionavel: false, modo: "sombra" as const };
    expect(lerModoDeDespacho(soAssinatura)).toBeNull();
    expect(lerModoDeDespacho(soAssinatura, autoridadeReal())).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 1-B. AS TRÊS GUARDAS FAIL-CLOSED, cada uma com o vetor que a MATA SOZINHA
// ---------------------------------------------------------------------------
//
// O DEFEITO DA PROVA ANTERIOR, medido por MUTAÇÃO em 2026-08-18 sobre o ramo
// sem autoridade de `lerModoDeDespacho`:
//
//   remover `if (d.acionavel) return null;`                        → 387 passed
//   remover `if (modo === "acionavel") return null;`               → 387 passed
//   remover `if (assinatura === "assinatura_verificada") ...`      → 1 failed
//
// Duas das três guardas eram INVISÍVEIS à suíte inteira de `apps/api`. Causa:
// TODO vetor deste arquivo carregava `assinatura: "assinatura_verificada"`,
// então só a terceira guarda decidia — inclusive no caso cujo NOME atribuía a
// recusa ao `acionavel: true`. O comentário do módulo dizia "fail-closed nos
// três, e não só no booleano"; a suíte provava UM.
//
// Os três vetores abaixo isolam cada termo: em cada um, exatamente UMA guarda
// pode disparar. Confirmado por mutação depois da correção — cada remoção
// isolada deixa o caso correspondente VERMELHO.

/** Só `acionavel` fora do lugar: assinatura ausente, modo sombra. */
const VETOR_SO_ACIONAVEL = Object.freeze({
  ...FORJA_COMPETENTE,
  acionavel: true,
  modo: "sombra" as const,
  bundle: Object.freeze({
    ...FORJA_COMPETENTE.bundle,
    assinatura: "assinatura_ausente" as const,
    bloqueiosDeAtivacao: Object.freeze([]),
  }),
});

/** Só o MODO fora do lugar: assinatura ausente, `acionavel` já falso. */
const VETOR_SO_MODO = Object.freeze({
  ...FORJA_COMPETENTE,
  acionavel: false,
  modo: "acionavel" as const,
  bundle: Object.freeze({
    ...FORJA_COMPETENTE.bundle,
    assinatura: "assinatura_ausente" as const,
    bloqueiosDeAtivacao: Object.freeze([]),
  }),
});

/** Só a ASSINATURA fora do lugar: `acionavel` falso, modo sombra. */
const VETOR_SO_ASSINATURA = Object.freeze({
  ...FORJA_COMPETENTE,
  acionavel: false,
  modo: "sombra" as const,
});

describe("ACHADO 2: cada guarda fail-closed do ramo sem autoridade tem vetor próprio", () => {
  it("GUARDA 1 (acionavel) — `acionavel: true` com assinatura ausente e modo sombra ⇒ null", () => {
    // Âncora de não-vacuidade: as OUTRAS duas guardas não podem disparar aqui,
    // senão este caso não prova nada sobre a primeira. Sem esta âncora, o teste
    // repetiria o erro que ele existe para corrigir.
    expect(VETOR_SO_ACIONAVEL.bundle.assinatura).not.toBe("assinatura_verificada");
    expect(VETOR_SO_ACIONAVEL.modo).not.toBe("acionavel");
    expect(VETOR_SO_ACIONAVEL.acionavel).toBe(true);

    expect(lerModoDeDespacho(VETOR_SO_ACIONAVEL)).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido({ despacho: VETOR_SO_ACIONAVEL })).toBeNull();
  });

  it("GUARDA 2 (modo) — `modo: 'acionavel'` com assinatura ausente e acionavel falso ⇒ null", () => {
    expect(VETOR_SO_MODO.bundle.assinatura).not.toBe("assinatura_verificada");
    expect(VETOR_SO_MODO.acionavel).toBe(false);
    expect(VETOR_SO_MODO.modo).toBe("acionavel");

    expect(lerModoDeDespacho(VETOR_SO_MODO)).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido({ despacho: VETOR_SO_MODO })).toBeNull();
  });

  it("GUARDA 3 (assinatura) — cadeia verificada alegada, sem acionabilidade nem modo ⇒ null", () => {
    expect(VETOR_SO_ASSINATURA.acionavel).toBe(false);
    expect(VETOR_SO_ASSINATURA.modo).not.toBe("acionavel");
    expect(VETOR_SO_ASSINATURA.bundle.assinatura).toBe("assinatura_verificada");

    expect(lerModoDeDespacho(VETOR_SO_ASSINATURA)).toBeNull();
    expect(modoDeDespachoDoResultadoPersistido({ despacho: VETOR_SO_ASSINATURA })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 1-C. ACHADO 1: a projeção publicável é ALLOW-LIST, não spread
// ---------------------------------------------------------------------------
//
// `resultadoPersistidoPublicavel` fazia `{ ...(result as ResultadoAvaliacao),
// despacho }`: SÓ a chave `despacho` era substituída e qualquer outra chave do
// blob passava. Reproduzido antes da correção:
//
//   SONDA/TOPO texto  => {"escore":0,…,"acionavel":true,
//                        "rotuloPt":"ACIONÁVEL — conduta clínica autorizada.",
//                        "despacho":null}
//   SONDA/DESCONHECIDO=> {"escore":0,"campoQueNaoExisteNoContrato":"SYNTH-CARGA",…}
//
// A tripwire `not.toContain('"acionavel":true')` do último caso deste arquivo
// passava por ACIDENTE DA FORMA DE FORJA escolhida (tudo dentro de `despacho`).
// A prova abaixo é por POSIÇÃO: a mesma carga é injetada em todo lugar em que
// ela cabe, e nenhuma posição pode publicá-la.

const MARCA_ACIONAVEL = '"acionavel":true';
const MARCA_TEXTO = "conduta clínica autorizada";
const ROTULO_FORJADO = "ACIONÁVEL — conduta clínica autorizada.";

/** Objeto adversário que carrega as DUAS marcas de uma vez. */
function cargaAdversaria(): Record<string, unknown> {
  return { acionavel: true, rotuloPt: ROTULO_FORJADO };
}

interface PosicaoDeInjecao {
  readonly nome: string;
  readonly forjar: (base: Record<string, unknown>) => Record<string, unknown>;
  /** Marcas presentes no blob forjado que a projeção NÃO pode publicar. */
  readonly marcas: readonly string[];
}

/** Percorre todo nó de objeto do valor, incluindo dentro de arrays. */
function varrerObjetos(valor: unknown, visitar: (no: Record<string, unknown>) => void): void {
  if (Array.isArray(valor)) {
    for (const item of valor) varrerObjetos(item, visitar);
    return;
  }
  if (typeof valor !== "object" || valor === null) return;
  const no = valor as Record<string, unknown>;
  visitar(no);
  for (const v of Object.values(no)) varrerObjetos(v, visitar);
}

const POSICOES: readonly PosicaoDeInjecao[] = [
  {
    nome: "topo/acionavel+rotuloPt (a forja que derrubou a tripwire anterior)",
    forjar: (b) => ({ ...b, ...cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "topo/chave que não existe no contrato",
    forjar: (b) => ({ ...b, cargaQueNaoExisteNoContrato: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "topo/despacho (forja competente — o vetor já conhecido)",
    forjar: (b) => ({ ...b, despacho: FORJA_COMPETENTE }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "dentro de despacho/chave extra",
    forjar: (b) => ({
      ...b,
      despacho: { ...(b.despacho as Record<string, unknown>), extra: cargaAdversaria() },
    }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "dentro de despacho/bundle/chave extra",
    forjar: (b) => {
      const d = b.despacho as Record<string, unknown>;
      return {
        ...b,
        despacho: {
          ...d,
          bundle: { ...(d.bundle as Record<string, unknown>), extra: cargaAdversaria() },
        },
      };
    },
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "dentro de parametros[0] (chave conhecida do contrato-pai, posição errada)",
    forjar: (b) => {
      const ps = [...(b.parametros as Record<string, unknown>[])];
      ps[0] = { ...ps[0], ...cargaAdversaria() };
      return { ...b, parametros: ps };
    },
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "dentro de parametros[0]/chave desconhecida",
    forjar: (b) => {
      const ps = [...(b.parametros as Record<string, unknown>[])];
      ps[0] = { ...ps[0], cargaAninhada: cargaAdversaria() };
      return { ...b, parametros: ps };
    },
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "dentro de parametros[0]/valor (campo numérico ocupado por objeto)",
    forjar: (b) => {
      const ps = [...(b.parametros as Record<string, unknown>[])];
      ps[0] = { ...ps[0], valor: cargaAdversaria() };
      return { ...b, parametros: ps };
    },
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "motivos[] com objeto no lugar de texto",
    forjar: (b) => ({ ...b, motivos: [cargaAdversaria()] }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "anotacoes[] com objeto no lugar de texto",
    forjar: (b) => ({ ...b, anotacoes: [cargaAdversaria()] }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "parametrosAusentes[] com objeto no lugar de texto",
    forjar: (b) => ({ ...b, parametrosAusentes: [cargaAdversaria()] }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "escore (campo numérico ocupado por objeto)",
    forjar: (b) => ({ ...b, escore: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "banda (campo de texto ocupado por objeto)",
    forjar: (b) => ({ ...b, banda: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "status (campo de texto ocupado por objeto)",
    forjar: (b) => ({ ...b, status: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "explicacao (campo de texto ocupado por objeto)",
    forjar: (b) => ({ ...b, explicacao: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "parametroVermelho (booleano ocupado por objeto)",
    forjar: (b) => ({ ...b, parametroVermelho: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
  {
    nome: "versaoRegra (campo de texto ocupado por objeto)",
    forjar: (b) => ({ ...b, versaoRegra: cargaAdversaria() }),
    marcas: [MARCA_ACIONAVEL, MARCA_TEXTO],
  },
];

/** Blob legítimo, serializado como o banco o guarda. */
function blobLegitimoPersistido(): Record<string, unknown> {
  const publicavel = resultadoNews2Publicavel(
    despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
  );
  return JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;
}

describe("ACHADO 1: a projeção publicável é allow-list — a carga não passa em POSIÇÃO alguma", () => {
  it("o blob legítimo tem as posições que os vetores ocupam (não-vacuidade da enumeração)", () => {
    const base = blobLegitimoPersistido();
    expect(Array.isArray(base.parametros)).toBe(true);
    expect((base.parametros as unknown[]).length).toBeGreaterThan(0);
    expect(Array.isArray(base.motivos)).toBe(true);
    expect(base.despacho).not.toBeNull();
    expect(POSICOES.length).toBeGreaterThanOrEqual(17);
  });

  for (const posicao of POSICOES) {
    it(`não publica a carga injetada em: ${posicao.nome}`, () => {
      const blob = posicao.forjar(blobLegitimoPersistido());
      const bruto = JSON.stringify(blob);
      // Âncora de não-vacuidade POR POSIÇÃO: a carga está mesmo no blob. Sem
      // isto, "não contém" seria verdade por a injeção não ter acontecido.
      for (const marca of posicao.marcas) {
        expect(bruto, `âncora falhou: a carga não entrou em ${posicao.nome}`).toContain(marca);
      }

      // Sem autoridade E com autoridade: a allow-list é do caminho de projeção
      // e não pode depender de qual ramo do envelope foi tomado.
      for (const autoridade of [undefined, autoridadeReal()]) {
        const saneado = resultadoPersistidoPublicavel(blob, autoridade);
        const texto = JSON.stringify(saneado);
        for (const marca of posicao.marcas) {
          expect(texto, `${posicao.nome} publicou "${marca}"`).not.toContain(marca);
        }
        // Prova estrutural, independente de serialização: nenhum nó do
        // resultado carrega `acionavel` verdadeiro, em profundidade alguma.
        varrerObjetos(saneado, (no) => {
          if (Object.hasOwn(no, "acionavel")) {
            expect(no.acionavel, `${posicao.nome}: nó com acionavel verdadeiro`).toBe(false);
          }
        });
        // …e nenhuma chave fora da allow-list atravessa o topo.
        const permitidas = new Set([...Object.keys(FORMA_DOS_CAMPOS_DO_RESULTADO), "despacho"]);
        for (const chave of Object.keys(saneado)) {
          expect(permitidas.has(chave), `chave "${chave}" escapou em ${posicao.nome}`).toBe(true);
        }
      }
    });
  }

  it("a allow-list cobre TODO campo que o caminho legítimo publica — nada some em silêncio", () => {
    // Contra-guarda da correção: uma allow-list que esquece um campo do
    // contrato apaga informação clínica da tela sem avisar. Este caso falha
    // quando `ResultadoAvaliacao` ganha campo e a tabela de formas não o segue.
    const base = blobLegitimoPersistido();
    const permitidas = new Set([...Object.keys(FORMA_DOS_CAMPOS_DO_RESULTADO), "despacho"]);
    for (const chave of Object.keys(base)) {
      expect(
        permitidas.has(chave),
        `campo "${chave}" do resultado real não está classificado`,
      ).toBe(true);
    }
    const contribuicao = (base.parametros as Record<string, unknown>[])[0];
    expect(contribuicao, "o resultado real precisa ter ao menos uma contribuição").toBeDefined();
    for (const chave of Object.keys(contribuicao as object)) {
      expect(
        Object.hasOwn(FORMA_DOS_CAMPOS_DA_CONTRIBUICAO, chave),
        `campo "${chave}" da contribuição real não está classificado`,
      ).toBe(true);
    }

    // …e o caminho legítimo atravessa a projeção sem perder nada.
    const saneado = resultadoPersistidoPublicavel(base, autoridadeReal()) as unknown as Record<
      string,
      unknown
    >;
    for (const chave of Object.keys(base)) {
      expect(Object.hasOwn(saneado, chave), `campo "${chave}" sumiu da projeção`).toBe(true);
    }
    expect(saneado.escore).toBe(base.escore);
    expect(saneado.banda).toBe(base.banda);
    expect((saneado.parametros as unknown[]).length).toBe((base.parametros as unknown[]).length);
  });
});

// ---------------------------------------------------------------------------
// 1-D. ACHADO 3: o texto pt-BR visível é DERIVADO, nunca copiado do blob
// ---------------------------------------------------------------------------
//
// `rotuloPt` e `mensagemRecusaPt` saíam do blob NOS DOIS RAMOS. Como a chave de
// junção é inteiramente pública (viaja em toda resposta legítima), copiá-la é
// trivial — e uma vez copiada o registro é aceito e o texto visível sai como o
// atacante o escreveu. Medido antes da correção:
//
//   SONDA/ACHADO3 => {"modo":"sombra","acionavel":false,
//     "rotuloPt":"ACIONÁVEL — conduta clínica autorizada. Iniciar
//                 noradrenalina 0,1 mcg/kg/min.", …}
//
// São QUATRO campos publicáveis com autoridade conciliada, não três: rótulo e
// mensagem de recusa são função do desfecho/motivo e são CONSTANTES do próprio
// serviço (`ROTULO_SOMBRA_PT`, `ROTULO_NAO_AVALIADO_PT`, `MOTIVO_RECUSA_PT` de
// `./tipos.ts`). Publicá-los do blob não acrescenta informação e importa texto
// normativo do atacante para a tela do intensivista (HAZ-0005).

const PRESCRICAO_FORJADA = "Iniciar noradrenalina 0,1 mcg/kg/min.";

describe("ACHADO 3: rótulo e mensagem de recusa vêm das constantes do serviço", () => {
  it("SEM autoridade: o texto do atacante não sobrevive à leitura", () => {
    const forja = {
      ...FORJA_COMPETENTE,
      acionavel: false,
      modo: "sombra" as const,
      rotuloPt: `${ROTULO_FORJADO} ${PRESCRICAO_FORJADA}`,
      bundle: { ...FORJA_COMPETENTE.bundle, assinatura: "assinatura_ausente" as const },
    };
    // Âncora: a prescrição forjada está no blob.
    expect(JSON.stringify(forja)).toContain(PRESCRICAO_FORJADA);

    const lido = lerModoDeDespacho(forja);
    expect(lido).not.toBeNull();
    expect(lido?.rotuloPt).toBe(ROTULO_SOMBRA_PT);
    expect(lido?.rotuloPt).not.toContain(PRESCRICAO_FORJADA);
    expect(JSON.stringify(lido)).not.toContain(MARCA_TEXTO);
  });

  it("COM autoridade conciliada: mesmo com a chave de junção REAL, o texto é o do serviço", () => {
    // Vetor mais forte do ACHADO 3: o atacante copia versão/behaviorHash/
    // digest reais (públicos em toda resposta) e escreve o texto que quiser.
    // A conciliação passa; o texto, não.
    const legitimo = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    ).despacho;

    const forja = {
      desfecho: "avaliada" as const,
      modo: "sombra" as const,
      acionavel: false,
      rotuloPt: `${ROTULO_FORJADO} ${PRESCRICAO_FORJADA}`,
      motivoRecusa: null,
      mensagemRecusaPt: null,
      versaoRegra: legitimo.versaoRegra,
      despachadoEm: AVALIACAO,
      bundle: {
        versaoBundle: legitimo.bundle.versaoBundle,
        digestManifesto: legitimo.bundle.digestManifesto,
        behaviorHash: legitimo.bundle.behaviorHash,
        assinatura: "assinatura_verificada" as const,
        bloqueiosDeAtivacao: [],
        ativoDesde: "2099-01-01T00:00:00.000Z",
      },
    };
    const lido = lerModoDeDespacho(forja, autoridadeReal());
    // Âncora de não-vacuidade: a conciliação REALMENTE ocorreu — se este
    // caso devolvesse `null`, ele não provaria nada sobre a derivação de texto.
    expect(lido, "a chave de junção copiada precisa conciliar").not.toBeNull();
    expect(lido?.rotuloPt).toBe(ROTULO_SOMBRA_PT);
    expect(lido?.rotuloPt).not.toContain(PRESCRICAO_FORJADA);
    expect(JSON.stringify(lido)).not.toContain(MARCA_TEXTO);
    // …e a proveniência publicada é a do RUNTIME, não a alegada.
    expect(lido?.bundle.assinatura).toBe("assinatura_ausente");
    expect(lido?.bundle.ativoDesde).not.toBe("2099-01-01T00:00:00.000Z");
  });

  it("mensagem de recusa é a constante do motivo, não a do blob", () => {
    const forja = {
      desfecho: "nao_avaliada" as const,
      modo: null,
      acionavel: false,
      rotuloPt: ROTULO_FORJADO,
      motivoRecusa: "bundle_ausente" as const,
      mensagemRecusaPt: `Tudo certo com o paciente. ${PRESCRICAO_FORJADA}`,
      versaoRegra: "RULE-NEWS2@0.2.0",
      despachadoEm: AVALIACAO,
      bundle: {
        versaoBundle: null,
        digestManifesto: null,
        behaviorHash: null,
        assinatura: "sem_bundle" as const,
        bloqueiosDeAtivacao: [],
        ativoDesde: null,
      },
    };
    const lido = lerModoDeDespacho(forja);
    expect(lido).not.toBeNull();
    expect(lido?.rotuloPt).toBe(ROTULO_NAO_AVALIADO_PT);
    expect(lido?.mensagemRecusaPt).toBe(MOTIVO_RECUSA_PT.bundle_ausente);
    // O texto do atacante ("tudo certo com o paciente") desapareceu, e o que
    // sobrou diz o oposto — ausência de resultado não é ausência de risco.
    expect(lido?.mensagemRecusaPt).toContain("Isto não significa ausência de risco");
    expect(JSON.stringify(lido)).not.toContain(PRESCRICAO_FORJADA);
  });

  it("desfecho e motivo/modo incoerentes entre si não são envelope deste serviço ⇒ null", () => {
    const base = {
      acionavel: false,
      rotuloPt: ROTULO_NAO_AVALIADO_PT,
      versaoRegra: "RULE-NEWS2@0.2.0",
      despachadoEm: AVALIACAO,
      mensagemRecusaPt: null,
      bundle: {
        versaoBundle: null,
        digestManifesto: null,
        behaviorHash: null,
        assinatura: "sem_bundle" as const,
        bloqueiosDeAtivacao: [],
        ativoDesde: null,
      },
    };
    // "avaliada" sem modo de ativação, ou com motivo de recusa junto.
    expect(
      lerModoDeDespacho({ ...base, desfecho: "avaliada", modo: null, motivoRecusa: null }),
    ).toBeNull();
    expect(
      lerModoDeDespacho({
        ...base,
        desfecho: "avaliada",
        modo: "sombra",
        motivoRecusa: "bundle_ausente",
      }),
    ).toBeNull();
    // "nao_avaliada" com modo de ativação, ou sem motivo.
    expect(
      lerModoDeDespacho({
        ...base,
        desfecho: "nao_avaliada",
        modo: "sombra",
        motivoRecusa: "bundle_ausente",
      }),
    ).toBeNull();
    expect(
      lerModoDeDespacho({ ...base, desfecho: "nao_avaliada", modo: null, motivoRecusa: null }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 1-E. ACHADO 4: sem autoridade não há PROVENIÊNCIA publicável
// ---------------------------------------------------------------------------

describe("ACHADO 4: o ramo sem autoridade não descreve artefato algum", () => {
  it("proveniência de regra que este runtime nunca carregou não é publicada", () => {
    const forja = {
      ...FORJA_COMPETENTE,
      acionavel: false,
      modo: "sombra" as const,
      bundle: {
        versaoBundle: "9.9.9",
        digestManifesto: `sha256:${"d".repeat(64)}`,
        behaviorHash: `sha256:${"e".repeat(64)}`,
        assinatura: "assinatura_ausente" as const,
        bloqueiosDeAtivacao: [],
        ativoDesde: "2099-01-01T00:00:00.000Z",
      },
    };
    // Âncora: a proveniência inventada está no blob.
    expect(JSON.stringify(forja)).toContain("9.9.9");
    expect(JSON.stringify(forja)).toContain("2099-01-01T00:00:00.000Z");

    const lido = lerModoDeDespacho(forja);
    expect(lido).not.toBeNull();
    expect(lido?.bundle).toEqual(PROVENIENCIA_NAO_ATESTADA);
    expect(lido?.bundle.versaoBundle).toBeNull();
    expect(lido?.bundle.digestManifesto).toBeNull();
    expect(lido?.bundle.behaviorHash).toBeNull();
    expect(lido?.bundle.ativoDesde).toBeNull();
    const texto = JSON.stringify(lido);
    expect(texto).not.toContain("9.9.9");
    expect(texto).not.toContain("2099-01-01T00:00:00.000Z");
    expect(texto).not.toContain("d".repeat(64));
    expect(texto).not.toContain("e".repeat(64));
  });

  it("`bloqueiosDeAtivacao` nunca sai VAZIO nessa condição — lista vazia lê-se como 'sem impedimento'", () => {
    const forja = {
      ...FORJA_COMPETENTE,
      acionavel: false,
      modo: "sombra" as const,
      bundle: { ...FORJA_COMPETENTE.bundle, assinatura: "assinatura_ausente" as const },
    };
    // Âncora: o blob alega ZERO bloqueios, que é o que a tela leria como "ok".
    expect(forja.bundle.bloqueiosDeAtivacao).toEqual([]);

    const lido = lerModoDeDespacho(forja);
    expect(lido?.bundle.bloqueiosDeAtivacao.length).toBeGreaterThan(0);
    expect(lido?.bundle.assinatura).toBe("sem_bundle");
    expect(lido?.acionavel).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. O caminho legítimo continua legível — a correção não apaga a degradação
// ---------------------------------------------------------------------------

describe("registro legítimo permanece publicável e explicitamente em sombra", () => {
  it("ida e volta com autoridade: modo sombra, acionavel false, proveniência DO RUNTIME", () => {
    const publicavel = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    );
    const persistido = JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;

    const relido = modoDeDespachoDoResultadoPersistido(persistido, autoridadeReal());
    expect(relido).not.toBeNull();
    expect(relido?.modo).toBe("sombra");
    expect(relido?.acionavel).toBe(false);
    expect(relido?.versaoRegra).toBe("RULE-NEWS2@0.2.0");
    // A proveniência publicada é a que o runtime carregou e verificou, não a
    // que o blob alega — mesmo quando as duas coincidem, a fonte é o runtime.
    expect(relido?.bundle.assinatura).toBe("assinatura_ausente");
    expect(relido?.bundle.bloqueiosDeAtivacao).toContain("assinatura_ausente_adr0007_c5");
    expect(relido?.bundle.behaviorHash).toBe(publicavel.despacho.bundle.behaviorHash);
  });

  it("SEM autoridade o registro legítimo continua legível, com acionavel false e SEM proveniência", () => {
    const publicavel = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    );
    const persistido = JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;
    const relido = modoDeDespachoDoResultadoPersistido(persistido);
    expect(relido?.modo).toBe("sombra");
    expect(relido?.acionavel).toBe(false);
    expect(relido?.rotuloPt).toBe(publicavel.despacho.rotuloPt);
    // ACHADO 4: legítimo ou não, sem autoridade a proveniência não é
    // publicável — este runtime não tem como atestar o artefato desta linha.
    expect(relido?.bundle).toEqual(PROVENIENCIA_NAO_ATESTADA);
    // Não-vacuidade: havia proveniência real a suprimir.
    expect(publicavel.despacho.bundle.behaviorHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("chave de junção divergente (behaviorHash trocado) ⇒ null, mesmo declarando não acionável", () => {
    const publicavel = resultadoNews2Publicavel(
      despacharNews2(registroReal(), INSUMO_NEWS2, CONTEXTO),
    );
    const persistido = JSON.parse(JSON.stringify(publicavel)) as {
      despacho: { bundle: { behaviorHash: string } };
    };
    persistido.despacho.bundle.behaviorHash = `sha256:${"c".repeat(64)}`;

    expect(
      modoDeDespachoDoResultadoPersistido(
        persistido as unknown as Record<string, unknown>,
        autoridadeReal(),
      ),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Kill switch de runtime retira a autoridade
// ---------------------------------------------------------------------------

describe("kill switch retira a autoridade da regra", () => {
  it("regra desligada ⇒ nenhum registro daquela regra é publicável", () => {
    const quadro = createClinicalRuleSwitchboard({
      telemetry: createInMemoryTelemetry(() => 1_000),
    });
    quadro.activate({ ruleId: "RULE-NEWS2", ruleVersion: "0.2.0" }, "SYNTH-ATOR-ACH8-3");
    const registro = comporRegistroDeRegras({
      config: { classePerfil: "sintetico" } as unknown as ConfiguracaoRuntime,
      quadroDeChaves: quadro,
    }).registro;

    const publicavel = resultadoNews2Publicavel(despacharNews2(registro, INSUMO_NEWS2, CONTEXTO));
    const persistido = JSON.parse(JSON.stringify(publicavel)) as Record<string, unknown>;
    // Âncora: antes do desligamento, o envelope É legível sob autoridade.
    expect(
      modoDeDespachoDoResultadoPersistido(persistido, {
        catalogo: registro,
        instanteIso: AVALIACAO,
      }),
    ).not.toBeNull();

    quadro.kill("RULE-NEWS2", {
      reasonCode: "defeito_de_regra_suspeito",
      actorId: "SYNTH-ATOR-ACH8-3",
    });

    expect(
      modoDeDespachoDoResultadoPersistido(persistido, {
        catalogo: registro,
        instanteIso: AVALIACAO,
      }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Ponta a ponta contra o servidor real, com linha FORJADA no banco
// ---------------------------------------------------------------------------

const cenario = buildG7SyntheticScenario();
const TENANT = cenario.organization.id;
const P002 = cenario.patients[1]!;
const ENC_P002 = cenario.encounters[1]!;
const AUTH = { authorization: `Bearer ${gerarTokenSintetico(TENANT, "SYNTH-MEDICO-ACH8-3")}` };

const FIXTURE_MAX_MS = Date.parse("2026-08-16T11:30:00.000Z");
let contador = 0;
function tempoClinicoFresco(): string {
  contador += 1;
  return new Date(Math.max(Date.now(), FIXTURE_MAX_MS) + contador * 60_000).toISOString();
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
 * VEREDITO CLÍNICO FORJADO — carga de ataque do `ACH-O3-1`, jamais um vetor
 * de referência. Nenhum número aqui descreve o NEWS2: são valores escolhidos
 * por um atacante hipotético, gravados no `result` persistido, na direção
 * clinicamente mais perigosa (esconder deterioração). O kernel real, para a
 * MESMA série, produz 11/`critico` — asserido em `resultadoNews2Publicavel`
 * neste arquivo e em `composicao/despacho-visivel.test.ts`.
 */
const VEREDITO_FORJADO = Object.freeze({
  escore: 0,
  banda: "normal",
  // `status: "valido"` é o que torna a ocultação COMPLETA: o veredito errado
  // viaja sem nenhuma degradação de status que sinalize algo errado à tela.
  status: "valido",
  explicacao: "SYNTH-FORJADO — paciente estável, nenhuma conduta necessária.",
  // Os três campos que `ExplicacaoDoBackend` RENDERIZA
  // (`apps/web/src/components/DetalhePaciente.tsx`): prosa pt-BR do atacante
  // na tela do intensivista. Parte do alcance do ACH-O3-1 que não estava
  // registrada em lugar nenhum.
  anotacoes: Object.freeze(["SYNTH-FORJADO — suspender vigilância horária."]),
  motivos: Object.freeze(["SYNTH-FORJADO-motivo-inexistente"]),
});

/** Veredito REAL do kernel para a série semeada. OBSERVADO, não redigido aqui. */
const ESCORE_REAL_DO_KERNEL = 11;
const BANDA_REAL_DO_KERNEL = "critico";

describe("ACH-REV8-3 ponta a ponta: linha forjada no banco não vira recomendação", () => {
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
      headers: { ...AUTH, "idempotency-key": "SYNTH-IDEM-ACH8-3" },
      payload: {
        encontroId: ENC_P002.id,
        leitoId: ENC_P002.bedId,
        pacienteRef: P002.subjectRef,
        contexto: { idadeAnos: 62 },
        observacoes: serieCompleta(tempoClinicoFresco()),
      },
    });
    expect(ingestao.statusCode).toBe(201);

    // `evaluation_records` é append-only (trigger de `0001_init.sql` recusa
    // UPDATE — OBSERVADO na reprodução). O vetor real é INSERIR uma linha mais
    // recente: as duas leituras tomam a mais recente do encontro.
    await withTenantTransaction(db, TENANT, async (tx) => {
      const atual = await tx.query<{ id: string; result: Record<string, unknown> }>(
        "select id, result from evaluation_records where encounter_id = $1 order by seq desc limit 1",
        [ENC_P002.id],
      );
      const original = atual.rows[0];
      expect(original, "a semeadura precisa ter produzido uma avaliação").toBeDefined();
      // Âncora de não-vacuidade do `ACH-O3-1`: a linha ORIGINAL carrega o
      // veredito do kernel; sem isto, "o forjado sobreviveu" seria trivial.
      expect(original!.result.escore).toBe(ESCORE_REAL_DO_KERNEL);
      expect(original!.result.banda).toBe(BANDA_REAL_DO_KERNEL);
      // A linha inserida forja DUAS coisas de naturezas distintas: o envelope
      // de despacho (ACH-REV8-3, FECHADO) e o veredito clínico (ACH-O3-1,
      // ABERTO). As colunas `status`/`total_score`/`risk_tier` são copiadas da
      // original de propósito — o que se quer isolar aqui é o blob `result`,
      // que é o que a rota de avaliações republica.
      const forjado = { ...original!.result, ...VEREDITO_FORJADO, despacho: FORJA_COMPETENTE };
      await tx.query(
        `insert into evaluation_records
           (id, tenant_id, encounter_id, subject_ref, status, total_score, risk_tier,
            red_parameter, fires, evaluated_at, result, kernel_record)
         select $1, tenant_id, encounter_id, subject_ref, status, total_score, risk_tier,
            red_parameter, fires, evaluated_at, $2, kernel_record
           from evaluation_records where id = $3`,
        ["SYNTH-AVAL-FORJADA-ACH8-3", forjado, original!.id],
      );
    });
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/projecoes/grade-leitos NÃO publica a acionabilidade forjada", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/v1/projecoes/grade-leitos",
      headers: AUTH,
    });
    expect(resposta.statusCode).toBe(200);
    // Âncora de não-vacuidade: o leito semeado está na grade e tem avaliação.
    const grade = resposta.json() as GradeLeitosResposta;
    const alvo = grade.leitos.find((l) => l.leitoId === ENC_P002.bedId);
    expect(alvo, "o leito semeado precisa estar na grade").toBeDefined();
    expect(alvo?.statusAvaliacao).toBe("valido");

    // VALOR, não forma: a linha forjada é lida como "modo não registrado".
    expect(alvo?.modoAvaliacao ?? null).toBeNull();
    expect(resposta.body).not.toContain('"acionavel":true');
    expect(resposta.body).not.toContain("conduta clínica autorizada");
  });

  it("ACH-REV8-3-A FECHADO: a rota de avaliações submete o blob à autoridade — despacho forjado sai null", async () => {
    // ANTES: `getPatientEvaluations` (apps/api/src/db.ts) devolvia
    // `row.result as unknown as ResultadoAvaliacao` — passagem CRUA, sem
    // validação alguma. Nem a checagem de coerência anterior existia aqui: a
    // reprodução mostrou que até uma forja INCOMPETENTE (assinatura ausente +
    // bloqueio presente + acionavel true) atravessava esta rota. Este caso
    // era tripwire (`toBe(true)`), não aprovação do comportamento.
    //
    // DEPOIS (fiação do handoff aplicada): `getPatientEvaluations` chama
    // `resultadoPersistidoPublicavel(row.result, { catalogo: registroDeRegras,
    // instanteIso })` para cada linha — o MESMO fecho já exercitado no caso
    // seguinte deste arquivo, agora ligado na rota real. A forja COMPETENTE
    // (assinatura verificada + zero bloqueios + modo acionável + acionavel
    // true) não tem autoridade que a sustente no catálogo do runtime:
    // `lerModoDeDespacho` devolve `null`, e é isso que a rota publica —
    // inversão que prova o fecho, não a apaga.
    const resposta = await app.inject({
      method: "GET",
      url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
      headers: AUTH,
    });
    const corpo = resposta.json() as AvaliacoesPacienteResposta;
    expect(corpo.avaliacoes.length).toBeGreaterThan(0);
    expect(corpo.avaliacoes[0]?.despacho).toBeNull();
  });

  it("o fecho é PARCIAL: neutraliza o despacho forjado e NÃO o veredito forjado (ACH-O3-1, ABERTO)", async () => {
    // POR QUE ESTE CASO LÊ DO BANCO, E NÃO DO HTTP
    // -------------------------------------------
    // A versão anterior obtinha o blob por `GET /v1/pacientes/.../avaliacoes`
    // e afirmava `despacho.acionavel === true`. Essa âncora MORREU porque o
    // fecho funcionou: a rota agora submete cada linha à autoridade antes de
    // responder (caso acima). O blob cru passa a ser lido de onde ele de fato
    // está — a linha que o `beforeAll` inseriu —, e não de uma superfície que
    // deliberadamente deixou de expô-lo.
    const bruto = await withTenantTransaction(db, TENANT, async (tx) => {
      const r = await tx.query<{ result: Record<string, unknown> }>(
        "select result from evaluation_records where id = $1",
        ["SYNTH-AVAL-FORJADA-ACH8-3"],
      );
      return r.rows[0]?.result;
    });
    // Âncora de não-vacuidade: a carga do atacante está mesmo persistida.
    expect(bruto, "a linha forjada precisa existir no banco").toBeDefined();
    const blob = bruto as Record<string, unknown>;
    expect((blob.despacho as { acionavel: boolean }).acionavel).toBe(true);

    const saneado = resultadoPersistidoPublicavel(blob);

    // 1) ACH-REV8-3 — FECHADO. A acionabilidade forjada não sobrevive.
    expect(saneado.despacho ?? null).toBeNull();
    expect(JSON.stringify(saneado)).not.toContain('"acionavel":true');
    expect(JSON.stringify(saneado)).not.toContain("conduta clínica autorizada");

    // 2) ACH-O3-1 — ABERTO. LIMITE CONHECIDO, NÃO COMPORTAMENTO DESEJADO.
    // -----------------------------------------------------------------
    // `resultadoPersistidoPublicavel` submete à autoridade APENAS o envelope
    // de despacho; a allow-list do ACHADO 1 fecha a injeção ESTRUTURAL. O
    // VALOR de escore, banda, status, motivos, anotações e explicação vem do
    // mesmo blob controlado pelo atacante e é republicado VERBATIM. As
    // asserções abaixo existem para que esse fato seja VISÍVEL e falhe alto
    // quando alguém mudar o comportamento sem atualizar o achado; elas NÃO
    // aprovam o comportamento.
    //
    // Fechar `ACH-O3-1` exige integridade do registro persistido (assinatura
    // de linha, HMAC ou coluna de digest) — desenho novo, que toca
    // `packages/persistencia` e provavelmente a MESMA custódia de chave que a
    // ADR-0007 C5 mantém ABERTA. Não foi feito aqui, de propósito.
    expect(saneado.escore).toBe(VEREDITO_FORJADO.escore);
    expect(saneado.banda).toBe(VEREDITO_FORJADO.banda);
    expect(saneado.explicacao).toBe(VEREDITO_FORJADO.explicacao);
    // Não-vacuidade do próprio ACH-O3-1: o publicado é o FORJADO, e não o do
    // kernel. Sem esta asserção, as três acima passariam por coincidência.
    expect(saneado.escore).not.toBe(ESCORE_REAL_DO_KERNEL);
    expect(saneado.banda).not.toBe(BANDA_REAL_DO_KERNEL);

    // 2-B) ALCANCE CORRIGIDO (ACHADO 5). O texto anterior dizia "fabrica UM
    // ESCORE". É maior, e estas asserções medem quanto:
    //
    // (i) OCULTA DETERIORAÇÃO SEM SINALIZAR NADA — `status` continua `valido`,
    // então nem o próprio contrato ("`escore` é `null` sempre que `status !==
    // 'valido'`") denuncia a substituição. É 11/`critico` virando 0/`normal`
    // com aparência de avaliação sadia.
    expect(saneado.status).toBe("valido");

    // (ii) PROSA pt-BR DO ATACANTE NA TELA — `explicacao`, `anotacoes` e
    // `motivos` são RENDERIZADOS por `ExplicacaoDoBackend`
    // (`apps/web/src/components/DetalhePaciente.tsx`): `<p>{explicacao}</p>`,
    // `<li>` por anotação e `motivos` em `<code>`. Não é metadado interno.
    expect(saneado.anotacoes).toEqual([...VEREDITO_FORJADO.anotacoes]);
    expect(saneado.motivos).toEqual([...VEREDITO_FORJADO.motivos]);
    expect(saneado.explicacao).toContain("nenhuma conduta necessária");

    // 3) …e o veredito forjado atravessa a ROTA REAL, ao lado de um despacho
    // já neutralizado. É esta combinação — `despacho: null` + escore fabricado
    // + `status: "valido"` + prosa do atacante — que descreve com exatidão o
    // estado de hoje.
    const resposta = await app.inject({
      method: "GET",
      url: `/v1/pacientes/${encodeURIComponent(P002.subjectRef)}/avaliacoes`,
      headers: AUTH,
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json() as AvaliacoesPacienteResposta;
    expect(corpo.avaliacoes.length).toBeGreaterThan(0);
    const publicada = corpo.avaliacoes[0];
    expect(publicada?.despacho ?? null).toBeNull();
    expect(publicada?.escore).toBe(VEREDITO_FORJADO.escore);
    expect(publicada?.banda).toBe(VEREDITO_FORJADO.banda);
    expect(publicada?.status).toBe("valido");
    expect(publicada?.explicacao).toBe(VEREDITO_FORJADO.explicacao);
    expect(publicada?.anotacoes).toEqual([...VEREDITO_FORJADO.anotacoes]);
    expect(publicada?.motivos).toEqual([...VEREDITO_FORJADO.motivos]);
  });

  it("LIMITE do ACH-O3-1 medido na outra direção: forjar só o blob NÃO move a GRADE", async () => {
    // Correção de alcance nos DOIS sentidos (ACHADO 5): registrar a exposição
    // maior sem inventar exposição que não existe. A grade toma
    // `escore`/`banda`/`statusAvaliacao` das COLUNAS de `evaluation_records`
    // (`total_score`, `risk_tier`, `status`), e a linha forjada do `beforeAll`
    // as copiou da original de propósito — logo a grade segue mostrando o
    // veredito do kernel, e não o do atacante.
    //
    // Isto NÃO é uma defesa: quem escreve no banco escreve as colunas também.
    // É delimitação do que ESTE achado, sobre ESTE blob, demonstra.
    const resposta = await app.inject({
      method: "GET",
      url: "/v1/projecoes/grade-leitos",
      headers: AUTH,
    });
    expect(resposta.statusCode).toBe(200);
    const grade = resposta.json() as GradeLeitosResposta;
    const alvo = grade.leitos.find((l) => l.leitoId === ENC_P002.bedId);
    expect(alvo, "o leito semeado precisa estar na grade").toBeDefined();
    expect(alvo?.escore).toBe(ESCORE_REAL_DO_KERNEL);
    expect(alvo?.banda).toBe(BANDA_REAL_DO_KERNEL);
    // Âncora: o blob forjado, esse sim, carrega o veredito do atacante.
    expect(alvo?.escore).not.toBe(VEREDITO_FORJADO.escore);
    // …e o corpo da grade não carrega a prosa do atacante.
    expect(resposta.body).not.toContain("SYNTH-FORJADO");
  });
});
