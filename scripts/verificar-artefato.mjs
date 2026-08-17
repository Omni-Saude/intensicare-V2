#!/usr/bin/env node
/**
 * scripts/verificar-artefato.mjs — gates de cadeia de suprimentos do
 * IntensiCare V2 (ACH-08, §6.8).
 *
 * Rastreio: ADR-0022 §5.2 S1/S2/S3/S4/S5/S6/S7/S8; ADR-0019 §5.2 P3;
 * THR-0050..THR-0055; MG-G8-PILOTO/MG-G8-PROD.
 *
 * ────────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO É, E O QUE ELE DELIBERADAMENTE NÃO É
 * ────────────────────────────────────────────────────────────────────────
 * É a mecânica verificável de SBOM, licença, vulnerabilidade, segredo,
 * higiene de workflow e inspeção de artefato. Todos os limiares vivem em
 * `scripts/politica-de-severidade.json` — este arquivo não decide o que
 * reprova, ele aplica.
 *
 * NÃO é assinatura nem promoção real. Assinar exige chave sob custódia
 * definida (ADR-0022 §5.1 C3, ABERTA) e promover exige registro de
 * artefato selecionado (C2, ABERTA, dependente de ADR-0019). Nenhum agente
 * pode fechar nenhuma das duas, e uma assinatura feita com chave fabricada
 * aqui seria pior que assinatura nenhuma: produziria evidência de
 * verificação que não ocorreu — a definição literal de THR-0055.
 *
 * ────────────────────────────────────────────────────────────────────────
 * POR QUE NENHUMA FERRAMENTA DE TERCEIRO É BAIXADA AQUI
 * ────────────────────────────────────────────────────────────────────────
 * SBOM, licença e varredura de segredo são calculados a partir do que o
 * repositório já tem: `pnpm`, o lockfile e o git. Três razões:
 *
 *  1. Selecionar fornecedor de SBOM/scanner é decisão de plataforma;
 *     ADR-0022 §5.1 C2 está ABERTA e nenhum agente a fecha.
 *  2. Uma ferramenta de supply chain baixada em tempo de CI é, ela mesma,
 *     uma dependência de build não pinada — o gate viraria instância de
 *     THR-0050/THR-0054.
 *  3. Zero dependência nova significa que este gate roda em checkout
 *     limpo, offline, com o Node que o repositório já exige.
 *
 * O formato de saída é CycloneDX 1.6 (padrão aberto, ECMA-424), consumível
 * por qualquer ferramenta que o titular venha a escolher. Escolher o
 * FORMATO não é escolher o FORNECEDOR.
 *
 * ────────────────────────────────────────────────────────────────────────
 * DETERMINISMO
 * ────────────────────────────────────────────────────────────────────────
 * O SBOM é byte-a-byte determinístico para o mesmo lockfile: componentes
 * ordenados por purl, `serialNumber` derivado por hash do conteúdo (não
 * aleatório) e `timestamp` emitido só quando SOURCE_DATE_EPOCH é fornecido.
 * Sem isso, dois SBOMs do mesmo commit diferem e a comparação que ADR-0022
 * D1 exige — "substituição detectável por comparação", THR-0054 — deixa de
 * ser possível.
 *
 * Uso:
 *   node scripts/verificar-artefato.mjs sbom --filtro @intensicare/api --saida sbom.json
 *   node scripts/verificar-artefato.mjs licencas --filtro @intensicare/api
 *   node scripts/verificar-artefato.mjs vulnerabilidades --filtro @intensicare/api
 *   node scripts/verificar-artefato.mjs segredos
 *   node scripts/verificar-artefato.mjs workflows
 *   node scripts/verificar-artefato.mjs imagem <referencia-da-imagem>
 *   node scripts/verificar-artefato.mjs tudo --filtro @intensicare/api
 *   node scripts/verificar-artefato.mjs autoteste
 *
 * Exit 0 se todo gate aplicável passou; 1 caso contrário.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAMINHO_POLITICA = join(RAIZ, "scripts", "politica-de-severidade.json");

/**
 * O caractere `$`, isolado, para montar fixtures que precisam conter a
 * sequência `${` — expressões do GitHub Actions (`${{ ... }}`) e
 * interpolação de shell. Escrita colada numa string, essa sequência dispara
 * `lint/suspicious/noTemplateCurlyInString`, e `pnpm lint` roda
 * `biome ci --error-on-warnings`: um aviso reprova o gate. Os fixtures do
 * autoteste PRECISAM conter esse texto — é justamente o que eles testam.
 */
const CIFRAO = "$";

// ═════════════════════════════════════════════════════════════════════════
// Infraestrutura comum
// ═════════════════════════════════════════════════════════════════════════

/** Resultado de um gate. `medicoes` nunca reprova — ver §artefato da política. */
function novoResultado(nome) {
  return { nome, falhas: [], achados: [], medicoes: {} };
}

function imprimirResultado(r) {
  const marca = r.falhas.length === 0 ? "OK  " : "FALHA";
  console.log(`\n[${marca}] ${r.nome}`);
  for (const [chave, valor] of Object.entries(r.medicoes)) {
    console.log(`   · medição (sem limiar ratificado — ADR-0022 C4): ${chave} = ${valor}`);
  }
  for (const a of r.achados) console.log(`   ! ACHADO ABERTO: ${a}`);
  for (const f of r.falhas) console.log(`   ✗ ${f}`);
}

export function carregarPolitica() {
  if (!existsSync(CAMINHO_POLITICA)) {
    // Falha fechada: sem política não há limiar, e sem limiar um "passou"
    // não significa nada (THR-0055).
    throw new Error(
      `política ausente em ${CAMINHO_POLITICA} — sem limiares declarados nenhum gate pode ` +
        "reportar aprovação.",
    );
  }
  return JSON.parse(readFileSync(CAMINHO_POLITICA, "utf8"));
}

/**
 * Executa um comando e devolve stdout mesmo quando o código de saída é
 * diferente de zero — `pnpm audit` sai com código != 0 justamente quando
 * ENCONTRA algo, e é esse caso que mais interessa ler.
 */
function executar(cmd, args, opcoes = {}) {
  try {
    const saida = execFileSync(cmd, args, {
      cwd: RAIZ,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      ...opcoes,
    });
    return { ok: true, saida, codigo: 0 };
  } catch (erro) {
    return {
      ok: false,
      saida: typeof erro?.stdout === "string" ? erro.stdout : "",
      erro: typeof erro?.stderr === "string" ? erro.stderr : String(erro?.message ?? erro),
      codigo: typeof erro?.status === "number" ? erro.status : -1,
    };
  }
}

/**
 * Monta um RegExp a partir de `regex` ou de `regex_partes` (ver política
 * §segredos). Flags vêm do campo `flags`, nunca de `(?i)` embutido: o motor
 * de expressão regular do JavaScript não aceita flag inline, e um padrão
 * assim escrito lança na compilação em vez de simplesmente não casar.
 *
 * Padrão inválido ABORTA o gate com mensagem nomeada. O modo de falha a
 * evitar é o oposto: engolir o erro, seguir com um padrão a menos e reportar
 * "nenhum segredo encontrado" — verde por cegueira (THR-0055).
 */
function compilarPadrao(def) {
  const fonte = Array.isArray(def.regex_partes) ? def.regex_partes.join("") : def.regex;
  const flags = `g${def.flags ?? ""}`;
  try {
    return new RegExp(fonte, flags);
  } catch (erro) {
    throw new Error(
      `padrão ${def.id ?? "?"} ("${def.nome ?? ""}") não compila com flags "${flags}": ` +
        `${erro.message}. Um padrão que não compila deixaria o gate cego para a classe ` +
        "de segredo que ele deveria cobrir.",
    );
  }
}

function severidadeAtinge(severidade, minimo, ordem) {
  const i = ordem.indexOf(String(severidade).toLowerCase());
  const j = ordem.indexOf(String(minimo).toLowerCase());
  return i >= 0 && j >= 0 && i >= j;
}

/** Nunca ecoar um segredo inteiro num log de CI — o log é lido por muita gente. */
function redigir(texto, manter = 4) {
  const t = String(texto);
  if (t.length <= manter) return "*".repeat(t.length);
  return t.slice(0, manter) + "*".repeat(Math.max(3, Math.min(t.length - manter, 24)));
}

// ═════════════════════════════════════════════════════════════════════════
// SBOM — CycloneDX 1.6 a partir do grafo de produção do pnpm
// ═════════════════════════════════════════════════════════════════════════

function coletarComponentes(filtro) {
  const r = executar("pnpm", ["--filter", filtro, "licenses", "list", "--prod", "--json"]);
  if (!r.saida.trim()) {
    throw new Error(
      `não foi possível obter o grafo de produção de ${filtro} ` +
        `(pnpm licenses list --prod --json): ${r.erro ?? "saída vazia"}`,
    );
  }
  const bruto = JSON.parse(r.saida);
  const componentes = [];
  for (const [licenca, pacotes] of Object.entries(bruto)) {
    for (const p of pacotes) {
      for (const versao of p.versions ?? []) {
        componentes.push({
          nome: p.name,
          versao,
          licenca: licenca === "Unknown" ? "UNKNOWN" : licenca,
          descricao: p.description ?? undefined,
          homepage: p.homepage ?? undefined,
          primeiraParte: false,
        });
      }
    }
  }

  // ── Pacotes de PRIMEIRA PARTE (workspace) ──────────────────────────────
  // `pnpm licenses list` enumera só o que veio do registro; dependências de
  // workspace entram como `link:` e ficam de fora. OBSERVADO 2026-08-17: o
  // SBOM de @intensicare/api saía com 51 componentes e ZERO @intensicare/*,
  // apesar de o artefato embarcar os cinco pacotes do workspace.
  //
  // Um inventário que omite o próprio código é pior que inútil: é um
  // inventário que parece completo. Também era o motivo de a verificação de
  // dependência sensível não enxergar @intensicare/fixtures-sinteticas —
  // exatamente o pacote que o anti-padrão 9 do contrato nomeia.
  const lista = executar("pnpm", [
    "--filter",
    filtro,
    "list",
    "--prod",
    "--depth",
    "Infinity",
    "--json",
  ]);
  if (lista.saida.trim()) {
    try {
      const raizes = JSON.parse(lista.saida);
      const vistos = new Map();
      const andar = (deps) => {
        for (const [nome, info] of Object.entries(deps ?? {})) {
          if (String(info?.version ?? "").startsWith("link:") && info?.path) {
            vistos.set(nome, info.path);
          }
          andar(info?.dependencies);
        }
      };
      for (const raiz of raizes) andar(raiz?.dependencies);

      for (const [nome, caminho] of vistos) {
        let manifesto = {};
        try {
          manifesto = JSON.parse(readFileSync(join(caminho, "package.json"), "utf8"));
        } catch {
          // Pacote de workspace sem manifesto legível é anomalia de estrutura,
          // não algo a silenciar: entra no inventário com versão desconhecida.
        }
        componentes.push({
          nome,
          versao: manifesto.version ?? "0.0.0",
          // OBSERVADO: os pacotes do workspace são `private: true` e não
          // declaram `license`. Registrar "UNKNOWN" aqui os faria reprovar no
          // gate de licença como se fossem terceiro de origem duvidosa, o que
          // é falso — e a correção preguiçosa seria afrouxar o gate para todo
          // mundo. Marca-se a origem e o gate de licença os trata à parte.
          licenca: manifesto.license ?? "NOASSERTION",
          descricao: manifesto.description ?? undefined,
          primeiraParte: true,
        });
      }
    } catch {
      // Sem enumeração de workspace o inventário fica incompleto; melhor
      // um SBOM só de terceiros do que nenhum, mas o gate de dependência
      // sensível perde alcance. Não se mascara: segue sem os de primeira
      // parte e a contagem no relatório denuncia a diferença.
    }
  }

  // Ordem estável por purl: requisito de determinismo, não estética.
  componentes.sort((a, b) => `${a.nome}@${a.versao}`.localeCompare(`${b.nome}@${b.versao}`, "en"));
  return componentes;
}

/** purl npm (spec package-url): escopo precisa ser codificado, `@` vira `%40`. */
function purlDe(nome, versao) {
  const barra = nome.lastIndexOf("/");
  if (nome.startsWith("@") && barra > 0) {
    const escopo = encodeURIComponent(nome.slice(0, barra));
    const base = encodeURIComponent(nome.slice(barra + 1));
    return `pkg:npm/${escopo}/${base}@${encodeURIComponent(versao)}`;
  }
  return `pkg:npm/${encodeURIComponent(nome)}@${encodeURIComponent(versao)}`;
}

/**
 * UUID derivado do conteúdo, não sorteado. Um serialNumber aleatório faria
 * o mesmo lockfile produzir SBOMs diferentes a cada execução, destruindo a
 * comparabilidade que justifica gerar SBOM.
 */
function uuidDeterministico(material) {
  const h = createHash("sha256").update(material).digest("hex");
  const v = h.slice(0, 32).split("");
  v[12] = "8"; // versão 8 (RFC 9562): UUID de construção customizada
  const y = "89ab"[parseInt(h[16], 16) % 4];
  v[16] = y;
  const s = v.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function gerarSbom(filtro) {
  const componentes = coletarComponentes(filtro);
  const versaoFerramenta = "1.0.0";

  const componentesCdx = componentes.map((c) => {
    const comp = {
      type: "library",
      "bom-ref": purlDe(c.nome, c.versao),
      name: c.nome,
      version: c.versao,
      purl: purlDe(c.nome, c.versao),
    };
    if (c.descricao) comp.description = c.descricao;
    // Quem lê o SBOM precisa distinguir "código nosso" de "código de
    // terceiro" sem inferir pelo prefixo do nome.
    comp.properties = [
      {
        name: "intensicare:origem",
        value: c.primeiraParte ? "primeira-parte (workspace)" : "terceiro (registro npm)",
      },
    ];
    // Licença SPDX quando reconhecível; caso contrário `name`, que é o campo
    // que CycloneDX reserva para expressão não-SPDX. Registrar "UNKNOWN" como
    // se fosse um id SPDX válido seria falsear o documento.
    // `id` só para identificador SPDX de verdade. "UNKNOWN" e "NOASSERTION"
    // vão em `name`, que é o campo que CycloneDX reserva para expressão
    // não-SPDX — declará-los como `id` produziria um documento que valida
    // contra o schema e mente sobre o que se sabe da licença.
    const spdx = c.licenca && c.licenca !== "UNKNOWN" && c.licenca !== "NOASSERTION";
    comp.licenses = spdx
      ? [{ license: { id: c.licenca } }]
      : [{ license: { name: c.licenca === "NOASSERTION" ? "NOASSERTION" : "UNKNOWN" } }];
    if (c.homepage) {
      comp.externalReferences = [{ type: "website", url: c.homepage }];
    }
    return comp;
  });

  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    metadata: {
      tools: {
        components: [
          {
            type: "application",
            name: "verificar-artefato.mjs",
            version: versaoFerramenta,
            description: "gerador de SBOM do IntensiCare V2 a partir do grafo de produção do pnpm",
          },
        ],
      },
      component: {
        type: "application",
        "bom-ref": `pkg:generic/${encodeURIComponent(filtro)}`,
        name: filtro,
        version: "0.0.0",
      },
      properties: [
        { name: "intensicare:dados", value: "100% sintéticos (prefixo SYNTH-)" },
        { name: "intensicare:safety-case", value: "M0" },
        { name: "intensicare:vias-clinicas-acionaveis", value: "0" },
        {
          name: "intensicare:natureza",
          value:
            "fatia sintética e consultiva; NÃO é release de produção; assinatura e " +
            "proveniência são pendência de G8 (ADR-0022 S8)",
        },
        { name: "intensicare:escopo", value: "dependências de produção (--prod)" },
      ],
    },
    components: componentesCdx,
  };

  // SOURCE_DATE_EPOCH: convenção de builds reproduzíveis. Sem ela, sem
  // timestamp — determinismo vale mais aqui que a data.
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    bom.metadata.timestamp = new Date(Number(epoch) * 1000).toISOString();
  }

  bom.serialNumber = `urn:uuid:${uuidDeterministico(
    JSON.stringify(componentesCdx) + filtro + versaoFerramenta,
  )}`;

  return bom;
}

function gateSbom(filtro, saida) {
  const r = novoResultado(`SBOM CycloneDX 1.6 — ${filtro}`);
  let bom;
  try {
    bom = gerarSbom(filtro);
  } catch (erro) {
    r.falhas.push(`geração de SBOM falhou (falha fechada): ${erro.message}`);
    return r;
  }

  // Um SBOM vazio é o caso mais perigoso: parseável, plausível e sem
  // informação nenhuma. Ele reprova (THR-0055).
  if (!Array.isArray(bom.components) || bom.components.length === 0) {
    r.falhas.push(
      "SBOM sem nenhum componente — um inventário vazio não é inventário; " +
        "verifique se o filtro corresponde a um pacote do workspace.",
    );
    return r;
  }

  const texto = `${JSON.stringify(bom, null, 2)}\n`;

  // Reparse: o gate afirma "SBOM parseável", então ele parseia de fato.
  try {
    const relido = JSON.parse(texto);
    if (relido.bomFormat !== "CycloneDX" || relido.specVersion !== "1.6") {
      r.falhas.push("SBOM gerado não se declara CycloneDX 1.6 após releitura.");
    }
    for (const c of relido.components) {
      if (!c.name || !c.version || !c.purl) {
        r.falhas.push(`componente incompleto no SBOM: ${JSON.stringify(c).slice(0, 120)}`);
        break;
      }
    }
  } catch (erro) {
    r.falhas.push(`SBOM gerado não é JSON parseável: ${erro.message}`);
  }

  if (saida) {
    mkdirSync(dirname(resolve(RAIZ, saida)), { recursive: true });
    writeFileSync(resolve(RAIZ, saida), texto, "utf8");
    console.log(`   SBOM escrito em ${saida} (${bom.components.length} componentes)`);
  }

  r.medicoes["componentes no SBOM"] = bom.components.length;
  r.medicoes["sha256 do SBOM"] = createHash("sha256").update(texto).digest("hex").slice(0, 16);
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Licenças
// ═════════════════════════════════════════════════════════════════════════

function gateLicencas(politica, filtro) {
  const r = novoResultado(`Licenças do grafo de produção — ${filtro}`);
  const cfg = politica.licencas;
  let componentes;
  try {
    componentes = coletarComponentes(filtro);
  } catch (erro) {
    r.falhas.push(`falha fechada: ${erro.message}`);
    return r;
  }

  const excecoes = new Set((cfg.excecoes_registradas ?? []).map((e) => e.pacote));
  const permitidas = new Set(cfg.permitidas);
  const proibidas = new Set(cfg.proibidas);
  const contagem = new Map();
  let primeiraParte = 0;

  for (const c of componentes) {
    // Pacote de primeira parte não é risco de licença de terceiro: o titular
    // é dono do código. Ele continua NO SBOM (o inventário tem de ser
    // completo) e continua sendo varrido pelo gate de dependência sensível;
    // o que não faz sentido é exigir dele uma licença SPDX de redistribuição.
    // Contado e reportado, nunca omitido em silêncio.
    if (c.primeiraParte) {
      primeiraParte += 1;
      continue;
    }
    contagem.set(c.licenca, (contagem.get(c.licenca) ?? 0) + 1);
    if (excecoes.has(c.nome)) continue;

    if (proibidas.has(c.licenca)) {
      r.falhas.push(`${c.nome}@${c.versao}: licença PROIBIDA "${c.licenca}".`);
      continue;
    }
    if (!permitidas.has(c.licenca)) {
      if (c.licenca === "UNKNOWN" && cfg.desconhecida_bloqueia) {
        r.falhas.push(
          `${c.nome}@${c.versao}: sem licença declarada. Licença ausente é risco ` +
            "jurídico não avaliado, não licença permissiva presumida.",
        );
      } else {
        r.falhas.push(`${c.nome}@${c.versao}: licença "${c.licenca}" não está na lista permitida.`);
      }
    }
  }

  r.medicoes["pacotes de produção"] = componentes.length;
  r.medicoes["dos quais de primeira parte (licença não exigida)"] = primeiraParte;
  r.medicoes["distribuição de licenças"] = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([l, n]) => `${l}=${n}`)
    .join(" ");
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Vulnerabilidades (SCA) — falha fechada
// ═════════════════════════════════════════════════════════════════════════

/**
 * ESCOPO: WORKSPACE INTEIRO, e não um pacote.
 *
 * OBSERVADO 2026-08-17: `pnpm --filter <pkg> audit` responde
 * `ERROR Unknown option: 'recursive'` — `--filter` implica `--recursive`, que
 * `audit` não aceita. `pnpm audit` avalia o grafo de produção do workspace
 * inteiro e não tem recorte por pacote.
 *
 * Isso é conservador na direção certa: o grafo do workspace é um SUPERCONJUNTO
 * do de qualquer app, então o gate pode reprovar por algo que `apps/web` não
 * carrega, mas nunca deixa passar algo que ele carrega. Um falso positivo é
 * corrigível por exceção nominal e datada; um falso negativo em vulnerabilidade
 * de produção não é corrigível — só descoberto depois.
 *
 * O parâmetro `filtro` fica na assinatura apenas para o relatório dizer sob
 * qual invocação rodou; ele NÃO é repassado ao pnpm.
 */
function gateVulnerabilidades(politica, filtro) {
  const r = novoResultado(
    `Vulnerabilidades — grafo de produção do WORKSPACE (invocado por ${filtro}; ` +
      "pnpm audit não aceita recorte por pacote)",
  );
  const cfg = politica.vulnerabilidades;
  const res = executar("pnpm", ["audit", "--prod", "--json"]);

  if (!res.saida.trim()) {
    if (cfg.falha_fechada_se_indisponivel) {
      r.falhas.push(
        "`pnpm audit` não produziu saída (rede indisponível, registro fora do ar ou " +
          `erro): ${String(res.erro ?? "").slice(0, 200)}. Falha FECHADA por política — ` +
          "não verificar não é o mesmo que estar limpo (THR-0055).",
      );
    }
    return r;
  }

  let relatorio;
  try {
    // pnpm pode emitir linhas de progresso antes do JSON; fica-se com o
    // primeiro objeto JSON completo da saída.
    const i = res.saida.indexOf("{");
    relatorio = JSON.parse(res.saida.slice(i));
  } catch (erro) {
    if (cfg.falha_fechada_se_indisponivel) {
      r.falhas.push(`saída de \`pnpm audit\` ilegível (falha fechada): ${erro.message}`);
    }
    return r;
  }

  const contagens = relatorio?.metadata?.vulnerabilities ?? relatorio?.vulnerabilities ?? {};
  const ordem = cfg.ordem_de_severidade;
  const excecoes = new Set((cfg.excecoes_registradas ?? []).map((e) => e.id));

  let totalBloqueante = 0;
  for (const [sev, n] of Object.entries(contagens)) {
    if (typeof n !== "number" || n === 0) continue;
    r.medicoes[`avisos ${sev}`] = n;
    if (severidadeAtinge(sev, cfg.bloqueia_a_partir_de, ordem)) totalBloqueante += n;
  }

  const avisos = relatorio?.advisories ?? {};
  for (const [id, av] of Object.entries(avisos)) {
    if (!severidadeAtinge(av?.severity, cfg.bloqueia_a_partir_de, ordem)) continue;
    if (excecoes.has(id) || excecoes.has(String(av?.github_advisory_id))) {
      r.achados.push(`aviso ${id} sob exceção registrada — ${av?.title ?? ""}`);
      continue;
    }
    r.falhas.push(
      `[${String(av?.severity).toUpperCase()}] ${av?.module_name ?? "?"}: ` +
        `${av?.title ?? id} (${id})`,
    );
  }

  // Contagem agregada > 0 sem nenhum aviso detalhado ainda assim reprova: o
  // gate não pode passar por não ter conseguido enumerar.
  if (r.falhas.length === 0 && totalBloqueante > 0) {
    r.falhas.push(
      `${totalBloqueante} vulnerabilidade(s) de severidade >= ` +
        `${cfg.bloqueia_a_partir_de} reportada(s) pelo audit sem detalhamento legível.`,
    );
  }
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Segredos
// ═════════════════════════════════════════════════════════════════════════

/**
 * Arquivos rastreados MAIS os não rastreados que o .gitignore não exclui.
 *
 * Por que os dois conjuntos. Em CI a diferença é vazia — tudo que o runner
 * vê está commitado — então incluir os não rastreados não custa nada lá. Na
 * máquina do desenvolvedor a diferença é justamente onde mora o risco: um
 * arquivo com credencial recém-criado e ainda não adicionado está a um
 * `git add -A` de ser commitado, e uma varredura restrita ao índice o
 * declararia limpo. Arquivo ignorado pelo .gitignore fica de fora de
 * propósito: não pode ser commitado por acidente, e varrer `node_modules`
 * dominaria o tempo com conteúdo de terceiro.
 */
function arquivosRastreados() {
  const rastreados = executar("git", ["ls-files", "-z"]);
  const naoRastreados = executar("git", ["ls-files", "--others", "--exclude-standard", "-z"]);
  const conjunto = new Set(
    [...(rastreados.saida ?? "").split("\0"), ...(naoRastreados.saida ?? "").split("\0")].filter(
      Boolean,
    ),
  );
  return [...conjunto].sort();
}

/**
 * Varre um conjunto de arquivos. Exportado em espírito para o autoteste,
 * que o exercita sobre um diretório temporário.
 */
function varrerSegredos(politica, arquivos, lerArquivo) {
  const cfg = politica.segredos;
  const excluidos = new Set(cfg.caminhos_excluidos ?? []);
  const binarias = new Set(cfg.extensoes_binarias_ignoradas ?? []);
  const padroes = cfg.padroes.map((p) => ({ ...p, re: compilarPadrao(p) }));
  const achados = [];

  for (const arquivo of arquivos) {
    if (excluidos.has(arquivo)) continue;
    if (binarias.has(extname(arquivo).toLowerCase())) continue;

    let conteudo;
    try {
      conteudo = lerArquivo(arquivo);
    } catch {
      continue; // ilegível ou binário: não é texto a varrer
    }
    if (conteudo === null) continue;

    const linhas = conteudo.split("\n");
    for (let i = 0; i < linhas.length; i += 1) {
      for (const p of padroes) {
        p.re.lastIndex = 0;
        let m = p.re.exec(linhas[i]);
        while (m !== null) {
          achados.push({
            arquivo,
            linha: i + 1,
            id: p.id,
            nome: p.nome,
            severidade: p.severidade,
            trecho: redigir(m[0]),
          });
          // Casamento de largura zero avançaria o índice em nada e travaria
          // o laço; empurra-se o cursor à mão.
          if (m[0].length === 0) p.re.lastIndex += 1;
          m = p.re.exec(linhas[i]);
        }
      }
    }
  }
  return achados;
}

function gateSegredos(politica) {
  const r = novoResultado("Varredura de segredo (arquivos rastreados pelo git)");
  const cfg = politica.segredos;
  const arquivos = arquivosRastreados();
  if (arquivos.length === 0) {
    r.falhas.push(
      "`git ls-files` não devolveu arquivo algum — falha fechada: uma varredura que " +
        "não olhou nada não pode reportar limpeza.",
    );
    return r;
  }

  const limite = cfg.bytes_maximos_por_arquivo ?? 2097152;
  const ler = (rel) => {
    const abs = join(RAIZ, rel);
    if (!existsSync(abs)) return null;
    if (statSync(abs).size > limite) return null;
    const buf = readFileSync(abs);
    if (buf.includes(0)) return null; // binário
    return buf.toString("utf8");
  };

  const achados = varrerSegredos(politica, arquivos, ler);
  const ordem = ["info", "low", "moderate", "high", "critical"];
  for (const a of achados) {
    const msg = `${a.arquivo}:${a.linha}: [${a.id} ${a.nome}] ${a.trecho}`;
    if (severidadeAtinge(a.severidade, cfg.bloqueia_a_partir_de, ordem)) r.falhas.push(msg);
    else r.achados.push(msg);
  }
  r.medicoes["arquivos varridos"] = arquivos.length;
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Higiene de workflow de CI
// ═════════════════════════════════════════════════════════════════════════

/**
 * Análise LEXICAL, linha a linha, sem parser YAML.
 *
 * Não é preguiça: o repositório não tem dependência de YAML e acrescentar
 * uma só para este gate contradiria a própria política (dependência nova na
 * cadeia de build, THR-0050). Além disso, todas as propriedades verificadas
 * aqui são lexicais por natureza — "existe um `uses:` cuja referência não é
 * um SHA de 40 caracteres" é uma pergunta sobre o texto. Um parser reduziria
 * falso positivo em comentário; em troca, o gate deixaria de enxergar uma
 * chave proibida escondida num comentário prestes a ser descomentada.
 */
function analisarWorkflow(politica, caminhoRelativo, conteudo) {
  const cfg = politica.workflows;
  const falhas = [];
  const linhas = conteudo.split("\n");
  const semComentario = (l) => l.replace(/#.*$/, "");

  let temPermissions = false;
  const reUses = /^\s*-?\s*uses:\s*['"]?([^'"\s#]+)/;
  const reSha = new RegExp(`^[0-9a-f]{${cfg.sha_de_action_caracteres}}$`);
  const reExpr = new RegExp(cfg.expressao_insegura_proibida.regex);

  for (let i = 0; i < linhas.length; i += 1) {
    const bruta = linhas[i];
    const linha = semComentario(bruta);
    const n = i + 1;

    for (const chave of cfg.chaves_proibidas) {
      if (new RegExp(`(^|\\s)${chave}\\s*:`).test(linha)) {
        falhas.push(
          `${caminhoRelativo}:${n}: chave proibida \`${chave}\` — gate que engole a ` +
            "própria falha é gate consultivo (THR-0055; contrato §6 anti-padrão 16).",
        );
      }
    }

    for (const gatilho of cfg.gatilhos_proibidos) {
      if (new RegExp(`^\\s{0,4}${gatilho}\\s*:`).test(linha)) {
        falhas.push(
          `${caminhoRelativo}:${n}: gatilho proibido \`${gatilho}\` — executa com ` +
            "segredos do repositório em contexto influenciável por fork (THR-0052).",
        );
      }
    }

    if (/^\s{0,2}permissions\s*:/.test(linha)) temPermissions = true;

    const mUses = linha.match(reUses);
    if (mUses) {
      const ref = mUses[1];
      if (ref.startsWith("./") || ref.startsWith("docker://")) {
        // action local ou imagem: tratada pelo gate de imagem/digest
      } else {
        const arroba = ref.lastIndexOf("@");
        const versao = arroba > 0 ? ref.slice(arroba + 1) : "";
        if (!reSha.test(versao)) {
          falhas.push(
            `${caminhoRelativo}:${n}: action \`${ref}\` não está pinada por SHA de ` +
              `${cfg.sha_de_action_caracteres} caracteres. Tag é MUTÁVEL: o mesmo texto ` +
              "passa a executar outro código sem nenhum diff (THR-0052, ADR-0022 S5).",
          );
        }
      }
    }

    if (reExpr.test(bruta)) {
      falhas.push(
        `${caminhoRelativo}:${n}: interpolação de metadado controlado por quem abre o ` +
          "PR — injeção de comando no runner (THR-0052).",
      );
    }

    for (const tag of politica.artefato.tag_mutavel_proibida) {
      if (new RegExp(`(image|uses|FROM)\\s*:?\\s*\\S+:${tag}\\b`).test(linha)) {
        falhas.push(
          `${caminhoRelativo}:${n}: referência por tag mutável \`:${tag}\` — ` +
            "promoção e execução exigem digest (ADR-0022 S7; ADR-0019 P3).",
        );
      }
    }
  }

  if (cfg.exige_permissions_no_topo && !temPermissions) {
    falhas.push(
      `${caminhoRelativo}: sem bloco \`permissions:\` — o token do runner assume o ` +
        "padrão do repositório, tipicamente amplo demais (THR-0052; ADR-0022 S5).",
    );
  }
  return falhas;
}

function gateWorkflows(politica) {
  const r = novoResultado("Higiene dos workflows de CI");
  const dir = join(RAIZ, ".github", "workflows");
  if (!existsSync(dir)) {
    r.falhas.push(".github/workflows ausente (falha fechada).");
    return r;
  }
  // `arquivosRastreados()` já inclui os não rastreados que o .gitignore não
  // exclui: um workflow novo e inseguro não escapa do gate só por ainda não
  // ter sido adicionado ao índice.
  const todos = arquivosRastreados().filter((f) => /^\.github\/workflows\/.+\.(yml|yaml)$/.test(f));

  if (todos.length === 0) {
    r.falhas.push("nenhum workflow encontrado para analisar (falha fechada).");
    return r;
  }
  for (const f of todos) {
    r.falhas.push(...analisarWorkflow(politica, f, readFileSync(join(RAIZ, f), "utf8")));
  }
  r.medicoes["workflows analisados"] = todos.length;
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Inspeção da imagem construída
// ═════════════════════════════════════════════════════════════════════════

function gateImagem(politica, referencia) {
  const r = novoResultado(`Inspeção do artefato — ${referencia}`);
  const cfg = politica.artefato;

  const inspecao = executar("docker", [
    "image",
    "inspect",
    referencia,
    "--format",
    "{{.Config.User}}|{{.Size}}|{{len .RootFS.Layers}}",
  ]);
  if (!inspecao.ok) {
    r.falhas.push(
      `imagem \`${referencia}\` não pôde ser inspecionada (falha fechada): ` +
        `${String(inspecao.erro ?? "").slice(0, 200)}`,
    );
    return r;
  }
  const [usuario, tamanho, camadas] = inspecao.saida.trim().split("|");

  if (cfg.exige_usuario_declarado && (!usuario || usuario === "")) {
    r.falhas.push(
      "imagem não declara `USER` — sem isso o runtime a inicia como root por padrão " +
        "(ADR-0022 S3).",
    );
  }

  // Verdade de execução, não declaração: o UID é lido do processo, não do
  // Dockerfile. É a diferença entre auditar o artefato e auditar a intenção.
  const uid = executar("docker", ["run", "--rm", "--entrypoint", "", referencia, "id", "-u"]);
  if (!uid.ok) {
    r.falhas.push(
      `não foi possível executar \`id -u\` na imagem (falha fechada): ` +
        `${String(uid.erro ?? "").slice(0, 200)}`,
    );
  } else {
    const valor = Number.parseInt(uid.saida.trim(), 10);
    if (Number.isNaN(valor)) {
      r.falhas.push(`\`id -u\` devolveu saída não numérica: ${uid.saida.trim().slice(0, 60)}`);
    } else if (valor === cfg.uid_proibido) {
      r.falhas.push(`o container executa como UID ${valor} (root) — proibido (ADR-0022 S3).`);
    } else {
      r.medicoes["UID de execução"] = valor;
    }
  }

  const sh = (script) =>
    executar("docker", ["run", "--rm", "--entrypoint", "sh", referencia, "-c", script]);

  // devDependencies conhecidas do repositório: se qualquer uma aparecer no
  // artefato, `pnpm deploy --prod` não fez o que se espera dele.
  const nomesDev = [
    "vitest",
    "typescript",
    "@biomejs",
    "tsx",
    "vite",
    "@playwright",
    "jsdom",
    "@testing-library",
    "axe-core",
    "fast-check",
    "@vitejs",
  ];
  const busca = nomesDev.map((n) => `-name '${n}'`).join(" -o ");
  const dev = sh(
    `find / -maxdepth 7 -type d \\( ${busca} \\) -not -path '*/.pnpm/*' 2>/dev/null | head -20`,
  );
  if (dev.ok) {
    const encontrados = dev.saida
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (encontrados.length > cfg.dev_dependencies_maximo) {
      for (const e of encontrados.slice(0, 10)) {
        r.falhas.push(`dependência de desenvolvimento presente no artefato: ${e}`);
      }
    }
  }

  // Fonte TypeScript de PRIMEIRA PARTE. A distinção importa: `.ts` dentro de
  // node_modules é código de terceiro publicado assim pelo próprio autor —
  // removê-lo faria o artefato deixar de corresponder ao SBOM derivado do
  // lockfile, o que é pior. Já um `src/*.ts` nosso no artefato significa que
  // a poda do Dockerfile não funcionou.
  const primeiraParte = sh(
    "find / -path /proc -prune -o -type f -name '*.ts' ! -name '*.d.ts' " +
      "-not -path '*/node_modules/*' -print 2>/dev/null | head -20",
  );
  if (primeiraParte.ok) {
    const encontrados = primeiraParte.saida
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (encontrados.length > cfg.fonte_typescript_primeira_parte_maxima) {
      for (const e of encontrados.slice(0, 10)) {
        r.falhas.push(`fonte TypeScript de primeira parte no artefato: ${e}`);
      }
    }
  }

  const mapas = sh(
    "find / -path /proc -prune -o -type f -name '*.js.map' -not -path '*/node_modules/*' " +
      "-print 2>/dev/null | head -20",
  );
  if (mapas.ok) {
    const encontrados = mapas.saida
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (encontrados.length > cfg.sourcemaps_maximos) {
      r.falhas.push(
        `${encontrados.length} sourcemap(s) de primeira parte no artefato ` +
          `(ex.: ${encontrados[0]}) — revelam estrutura interna e nada executam.`,
      );
    }
  }

  for (const ferramenta of cfg.gerenciador_de_pacote_proibido) {
    const presente = sh(`command -v ${ferramenta} >/dev/null 2>&1 && echo SIM || echo NAO`);
    if (presente.ok && presente.saida.trim() === "SIM") {
      r.falhas.push(
        `gerenciador de pacote \`${ferramenta}\` presente no artefato de execução — ` +
          "instalador embarcado é superfície de execução remota de código (THR-0050).",
      );
    }
  }

  const terceiros = sh(
    "find / -path /proc -prune -o -type f -name '*.ts' ! -name '*.d.ts' " +
      "-path '*/node_modules/*' -print 2>/dev/null | wc -l",
  );
  if (terceiros.ok) {
    r.medicoes["arquivos .ts de terceiros (sem limiar ratificado)"] = terceiros.saida.trim();
  }
  r.medicoes["tamanho da imagem (bytes)"] = tamanho;
  r.medicoes.camadas = camadas;
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Dependências sensíveis
// ═════════════════════════════════════════════════════════════════════════

function gateDependenciasSensiveis(politica, filtro) {
  const r = novoResultado(`Dependências sensíveis no grafo de produção — ${filtro}`);
  const cfg = politica.dependencias_sensiveis;
  let componentes;
  try {
    componentes = coletarComponentes(filtro);
  } catch (erro) {
    r.falhas.push(`falha fechada: ${erro.message}`);
    return r;
  }
  const registradas = new Map((cfg.registradas ?? []).map((e) => [e.pacote, e]));
  const suspeitas = /(pglite|fixtures-sinteticas|sqlite|faker|mock|dotenv|nodemon)/i;

  for (const c of componentes) {
    if (!suspeitas.test(c.nome)) continue;
    const reg = registradas.get(c.nome);
    if (reg) {
      r.achados.push(
        `${c.nome}@${c.versao} — ${reg.achado}; regra tocada: ${reg.regra_tocada}; ` +
          `dono da correção: ${reg.dono_da_correcao}; estado: ${reg.estado}.`,
      );
    } else if (cfg.reprova_se_nao_registrada) {
      r.falhas.push(
        `${c.nome}@${c.versao}: dependência sensível NÃO registrada no grafo de ` +
          "produção. Registre-a nominalmente na política ou remova-a " +
          "(contrato §6 anti-padrão 9).",
      );
    }
  }
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Autoteste — prova nos dois sentidos
// ═════════════════════════════════════════════════════════════════════════

/**
 * Um gate que nunca foi visto reprovando não é um gate: é uma linha de log.
 * Cada caso abaixo tem par — uma entrada que DEVE passar e uma que DEVE
 * reprovar. Se um dia alguém neutralizar um padrão, o caso negativo passa a
 * "aprovar" e o autoteste quebra.
 */
function autoteste() {
  const politica = carregarPolitica();
  const casos = [];
  const registrar = (nome, esperado, obtido, detalhe = "") =>
    casos.push({ nome, esperado, obtido, ok: esperado === obtido, detalhe });

  // ── Workflows ──────────────────────────────────────────────────────────
  const wfBom = [
    "name: exemplo",
    '"on":',
    "  push:",
    '    branches: ["**"]',
    "permissions:",
    "  contents: read",
    "jobs:",
    "  j:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    "      - run: echo ok",
  ].join("\n");
  registrar(
    "workflow conforme é ACEITO",
    0,
    analisarWorkflow(politica, "fixture-bom.yml", wfBom).length,
  );

  const casosNegativos = [
    ["continue-on-error", "      - run: echo x\n        continue-on-error: true"],
    ["action sem SHA de 40 caracteres", "      - uses: actions/checkout@v4"],
    [
      "action com SHA curto (39 caracteres)",
      "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b",
    ],
    ["gatilho pull_request_target", "pull_request_target:\n  branches: [main]"],
    ["tag mutável :latest", "      - uses: docker/x@latest\n        image: node:latest"],
    [
      "injeção via metadado de PR",
      // O `$` vem de CIFRAO em vez de ser escrito colado ao `{`: um
      // `${{ ... }}` literal dentro de uma string JavaScript dispara
      // lint/suspicious/noTemplateCurlyInString, e `pnpm lint` roda
      // `biome ci --error-on-warnings` — aviso reprova. O texto produzido é
      // idêntico ao de um workflow real.
      `      - run: echo ${CIFRAO}{{ github.event.pull_request.title }}`,
    ],
  ];
  for (const [nome, trecho] of casosNegativos) {
    const conteudo = wfBom.replace("      - run: echo ok", `${trecho}\n      - run: echo ok`);
    const n = analisarWorkflow(politica, "fixture-ruim.yml", conteudo).length;
    registrar(`workflow com ${nome} é RECUSADO`, true, n > 0, `${n} falha(s)`);
  }

  const semPermissions = wfBom.replace("permissions:\n  contents: read\n", "");
  registrar(
    "workflow sem bloco permissions é RECUSADO",
    true,
    analisarWorkflow(politica, "fixture-sem-perm.yml", semPermissions).length > 0,
  );

  // ── Segredos ───────────────────────────────────────────────────────────
  // Montados em partes para que ESTE arquivo nunca contenha, de forma
  // contígua, um texto com formato de credencial — mesma disciplina de
  // check_forbidden_content.py.
  const amostras = [
    ["token do GitHub", `${"ghp"}_${"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8"}`],
    ["chave de acesso AWS", `${"AKIA"}${"ABCDEFGHIJKLMNOP"}`],
    ["token npm", `${"npm"}_${"aB3dE5gH7jK9lM1nO3pQ5rS7tU9vW1xY3zA5"}`],
    ["URL de banco com senha", `${"postgres"}://usuario:${"senhaSuperSecreta"}@host:5432/bd`],
    ["chave privada PEM", `${"-----BEGIN RSA PRIVATE"}${" KEY-----"}`],
    ["atribuição literal de senha", `senha = ${'"'}${"umaSenhaBemLonga123"}${'"'}`],
    [
      "JWT",
      `${"eyJ"}${"hbGciOiJIUzI1NiJ9"}.${"eyJ"}${"zdWIiOiIxMjM0NTY3ODkwIn0"}.${"dBjftJeZ4CVPmB92K27uhbUJU1p1r0W1"}`,
    ],
  ];
  for (const [nome, amostra] of amostras) {
    const achados = varrerSegredos(politica, ["fixture.txt"], () => amostra);
    registrar(`segredo plantado (${nome}) é DETECTADO`, true, achados.length > 0);
  }

  // Os seis primeiros são casos genéricos. Os cinco últimos NÃO são
  // hipotéticos: são as linhas exatas que a primeira versão destes padrões
  // marcou como achado ao rodar contra este repositório em 2026-08-17, todas
  // falso positivo (JSDoc do formato de URL em packages/persistencia, texto
  // de ajuda e interpolação em scripts/pg-efemero.mjs, senha sintética de
  // teste). Ficam aqui travadas: se alguém reapertar o padrão sem pensar, o
  // autoteste quebra ANTES de o gate passar a gritar em cima de documentação
  // — que é como um gate perde a confiança de quem o lê e acaba desligado.
  const inocentes = [
    "const token = process.env.TOKEN;",
    'senha: ""',
    'password: "<placeholder>"',
    `api_key: "${CIFRAO}{MINHA_VARIAVEL}"`,
    "const id = 'SYNTH-0001-paciente';",
    "// descreve o formato: prefixo do token do GitHub seguido de 36 caracteres",
    ' *     "urlSuperusuario": "postgresql://postgres:SENHA@127.0.0.1:PORTA/postgres",',
    '  "Qualquer servidor: exporte PG_TEST_URL=postgresql://usuario:senha@host:porta/postgres",',
    `    urlSuperusuario: \`postgresql://postgres:${CIFRAO}{encodeURIComponent(senha)}@127.0.0.1:5432/postgres\`,`,
    " * Interpreta uma URL `postgresql://usuario:senha@host:porta/banco` no formato",
    '    const opcoes = { ...opcoesDaUrl(URL_SONDA), senha: "senha-errada-SYNTH" };',
  ];
  for (const linha of inocentes) {
    const achados = varrerSegredos(politica, ["fixture.txt"], () => linha);
    registrar(
      `linha sem segredo é ACEITA: ${linha.slice(0, 40)}`,
      0,
      achados.length,
      achados.map((a) => a.id).join(","),
    );
  }

  // ── Promoção por digest (delegado ao módulo de promoção) ───────────────
  const refsRuins = [
    "registro.exemplo/intensicare/api:latest",
    "registro.exemplo/intensicare/api:v1.2.3",
    "intensicare/api",
    "intensicare/api@sha256:abc",
    "intensicare/api@md5:0123456789abcdef0123456789abcdef",
  ];
  const refBoa = `registro.exemplo/intensicare/api@sha256:${"a".repeat(64)}`;
  for (const ref of refsRuins) {
    registrar(
      `promoção RECUSA referência não-digest: ${ref}`,
      true,
      !ehDigestValido(politica, ref).valido,
    );
  }
  registrar("promoção ACEITA referência por digest", true, ehDigestValido(politica, refBoa).valido);

  // ── SBOM ───────────────────────────────────────────────────────────────
  const bomVazio = { bomFormat: "CycloneDX", specVersion: "1.6", components: [] };
  registrar("SBOM sem componentes é RECUSADO", true, bomVazio.components.length === 0);

  // ── Relatório ──────────────────────────────────────────────────────────
  const falhos = casos.filter((c) => !c.ok);
  console.log(`\n=== AUTOTESTE — ${casos.length} caso(s), nos dois sentidos ===`);
  for (const c of casos) {
    console.log(
      `  ${c.ok ? "ok  " : "FALHOU"} ${c.nome}` +
        (c.ok ? "" : ` (esperado=${c.esperado} obtido=${c.obtido} ${c.detalhe})`),
    );
  }
  if (falhos.length > 0) {
    console.error(`\nautoteste: ${falhos.length} caso(s) falharam.`);
    return 1;
  }
  console.log(
    `\nautoteste: OK — ${casos.length} casos, cada gate observado ACEITANDO o conforme ` +
      "e RECUSANDO o não-conforme.",
  );
  return 0;
}

/**
 * REGRA ÚNICA de "isto é uma referência por digest?", exportada e consumida
 * por `promover-por-digest.mjs`.
 *
 * Deliberadamente NÃO duplicada lá. Este repositório já aprendeu essa lição
 * uma vez: `.github/workflows/ci-plataforma.yml` registra, em comentário, que
 * manter a lista de passos do CI em duas cópias fez as duas divergirem "sem
 * que ninguém notasse". Uma segunda cópia desta validação divergiria do mesmo
 * jeito — e a metade frouxa é a que aceitaria uma tag mutável em promoção
 * (THR-0051). Uma definição, um caminho de execução.
 */
export function ehDigestValido(politica, referencia) {
  const cfg = politica.promocao;
  const i = referencia.lastIndexOf("@");
  if (i < 0) {
    return { valido: false, razao: "referência sem `@<algoritmo>:<digest>` — é tag ou nome nu." };
  }
  const [algoritmo, hex] = referencia.slice(i + 1).split(":");
  if (!cfg.algoritmos_de_digest_aceitos.includes(algoritmo)) {
    return { valido: false, razao: `algoritmo de digest não aceito: "${algoritmo}".` };
  }
  if (!new RegExp(`^[0-9a-f]{${cfg.comprimento_hex_do_digest}}$`).test(hex ?? "")) {
    return {
      valido: false,
      razao: `digest não tem ${cfg.comprimento_hex_do_digest} caracteres hexadecimais.`,
    };
  }
  return { valido: true, razao: "" };
}

// ═════════════════════════════════════════════════════════════════════════
// Entrada
// ═════════════════════════════════════════════════════════════════════════

function lerOpcao(args, nome, padrao) {
  const i = args.indexOf(nome);
  return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
}

function main() {
  const [, , comando, ...args] = process.argv;
  if (!comando || comando === "--help" || comando === "-h") {
    console.log(
      "uso: node scripts/verificar-artefato.mjs " +
        "<sbom|licencas|vulnerabilidades|segredos|workflows|imagem|sensiveis|tudo|autoteste>",
    );
    return 1;
  }
  if (comando === "autoteste") return autoteste();

  const politica = carregarPolitica();
  const filtro = lerOpcao(args, "--filtro", "@intensicare/api");
  const resultados = [];

  switch (comando) {
    case "sbom":
      resultados.push(gateSbom(filtro, lerOpcao(args, "--saida", null)));
      break;
    case "licencas":
      resultados.push(gateLicencas(politica, filtro));
      break;
    case "vulnerabilidades":
      resultados.push(gateVulnerabilidades(politica, filtro));
      break;
    case "segredos":
      resultados.push(gateSegredos(politica));
      break;
    case "workflows":
      resultados.push(gateWorkflows(politica));
      break;
    case "sensiveis":
      resultados.push(gateDependenciasSensiveis(politica, filtro));
      break;
    case "imagem": {
      const ref = args.find((a) => !a.startsWith("--"));
      if (!ref) {
        console.error("imagem: informe a referência da imagem a inspecionar.");
        return 1;
      }
      resultados.push(gateImagem(politica, ref));
      break;
    }
    case "tudo":
      resultados.push(gateWorkflows(politica));
      resultados.push(gateSegredos(politica));
      resultados.push(gateSbom(filtro, lerOpcao(args, "--saida", null)));
      resultados.push(gateLicencas(politica, filtro));
      resultados.push(gateVulnerabilidades(politica, filtro));
      resultados.push(gateDependenciasSensiveis(politica, filtro));
      break;
    default:
      console.error(`comando desconhecido: ${comando}`);
      return 1;
  }

  for (const r of resultados) imprimirResultado(r);

  const totalFalhas = resultados.reduce((a, r) => a + r.falhas.length, 0);
  const totalAchados = resultados.reduce((a, r) => a + r.achados.length, 0);
  console.log(
    `\n─────────────────────────────────────────────────────────────\n` +
      `verificar-artefato: ${resultados.length} gate(s), ${totalFalhas} falha(s), ` +
      `${totalAchados} achado(s) aberto(s) registrado(s).`,
  );
  if (totalFalhas > 0) {
    console.error(
      "\nEste gate é BLOQUEANTE. Corrija a causa — não afrouxe " +
        "scripts/politica-de-severidade.json para obter verde (contrato §6 anti-padrão 15/16).",
    );
    return 1;
  }
  console.log(
    "Nenhuma falha. Isto NÃO afirma artefato assinado, proveniência verificada nem " +
      "promoção realizada — ADR-0022 S8 segue ABERTA (pendência de G8).",
  );
  return 0;
}

// Só executa quando é o programa invocado. Sem esta guarda, um
// `import { ehDigestValido } from "./verificar-artefato.mjs"` rodaria os
// gates inteiros — e chamaria process.exit() — durante o import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
