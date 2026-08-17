#!/usr/bin/env node
/**
 * scripts/promover-por-digest.mjs — mecânica de promoção de artefato por
 * digest imutável (ACH-08, §6.8).
 *
 * Rastreio: ADR-0019 §5.2 P1 (só existem hoje dev local e CI efêmero), P3
 * (artefato único promovido por digest, nunca rebuild por ambiente), P7
 * (rollback/roll-forward declarados antes de tráfego real); ADR-0022 §5.2 S7
 * (digest, nunca tag mutável), S8 (SBOM/proveniência/assinatura como
 * pendência de G8), §8.3 (nenhum artefato desta V2 vai além de dev/CI
 * efêmero enquanto S8 não fechar); THR-0051; MG-G8-PILOTO, MG-G8-PROD.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ESTE SCRIPT NÃO PROMOVE NADA HOJE — E ISSO É O COMPORTAMENTO CORRETO
 * ────────────────────────────────────────────────────────────────────────
 * Ele implementa e IMPÕE as pré-condições de uma promoção. Com o estado
 * atual do repositório, toda invocação de `promover` termina BLOQUEADA, por
 * três razões independentes e todas registradas:
 *
 *   1. `ambientes_provisionados` está vazio (ADR-0019 §5.2 P1) — não há
 *      destino para onde promover;
 *   2. não há registro de artefato selecionado (ADR-0022 §5.1 C2, ABERTA);
 *   3. não há custódia de chave de assinatura definida (C3, ABERTA).
 *
 * Um script que "promovesse" mesmo assim estaria produzindo evidência de uma
 * operação que não ocorreu. O valor de tê-lo agora é que as regras ficam
 * executáveis e testadas ANTES de existir um ambiente real — quando o
 * registro chegar, o caminho seguro já é o caminho padrão, em vez de ser
 * algo a lembrar de acrescentar sob pressão de entrega.
 *
 * NUNCA assina com chave fabricada localmente. Se o verificador de
 * assinatura não estiver disponível, o resultado é BLOQUEADO — nunca
 * "assinatura dispensada".
 *
 * Uso:
 *   node scripts/promover-por-digest.mjs --verificar <referencia>
 *   node scripts/promover-por-digest.mjs --artefato <ref@sha256:...> \
 *       --de ci-efemero --para staging [--evidencia caminho.json]
 *
 * Exit 0 só quando toda pré-condição foi satisfeita; 1 caso contrário.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarPolitica, ehDigestValido } from "./verificar-artefato.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function lerOpcao(args, nome, padrao = null) {
  const i = args.indexOf(nome);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : padrao;
}

function disponivel(binario) {
  try {
    execFileSync("sh", ["-c", `command -v ${binario}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verificação de assinatura. FALHA FECHADA em todos os caminhos.
 *
 * A tentação a evitar é `if (!temCosign) return { ok: true }` — "não deu
 * para verificar, seguimos". Isso é exatamente o artefato implantado que
 * não é o artefato construído (THR-0051), com um registro verde por cima.
 */
function verificarAssinatura(referencia) {
  if (!disponivel("cosign")) {
    return {
      ok: false,
      bloqueado: true,
      detalhe:
        "verificador de assinatura (cosign) ausente no PATH. BLOQUEADO — não é " +
        "aprovação implícita. Provisionamento pendente: ADR-0022 §5.1 C3 (custódia " +
        "de chave, AUTH-SECURITY).",
    };
  }
  const raizDeConfianca = process.env.INTENSICARE_COSIGN_RAIZ_CONFIANCA;
  if (!raizDeConfianca) {
    return {
      ok: false,
      bloqueado: true,
      detalhe:
        "cosign presente, mas INTENSICARE_COSIGN_RAIZ_CONFIANCA não definida. " +
        "Verificar assinatura sem âncora de confiança declarada apenas confirma que " +
        "ALGUÉM assinou — não que quem assinou tinha autoridade para tanto.",
    };
  }
  try {
    execFileSync("cosign", ["verify", "--key", raizDeConfianca, referencia], {
      stdio: "pipe",
    });
    return {
      ok: true,
      bloqueado: false,
      detalhe: "assinatura verificada contra a âncora declarada.",
    };
  } catch (erro) {
    return {
      ok: false,
      bloqueado: false,
      detalhe: `verificação de assinatura FALHOU: ${String(erro?.stderr ?? erro?.message ?? erro).slice(0, 300)}`,
    };
  }
}

/** Proveniência (atestado in-toto/SLSA). Mesma disciplina: falha fechada. */
function verificarProveniencia(referencia) {
  if (!disponivel("cosign")) {
    return {
      ok: false,
      bloqueado: true,
      detalhe:
        "verificador de atestado ausente. BLOQUEADO. A proveniência responde 'que " +
        "fonte, que construtor, que entradas produziram este digest' — sem ela, o " +
        "digest prova apenas que os bytes não mudaram DEPOIS do build, nada sobre " +
        "o que entrou nele (THR-0050/THR-0052).",
    };
  }
  try {
    execFileSync("cosign", ["verify-attestation", "--type", "slsaprovenance", referencia], {
      stdio: "pipe",
    });
    return { ok: true, bloqueado: false, detalhe: "atestado de proveniência verificado." };
  } catch (erro) {
    return {
      ok: false,
      bloqueado: false,
      detalhe: `verificação de proveniência FALHOU: ${String(erro?.stderr ?? erro?.message ?? erro).slice(0, 300)}`,
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const politica = carregarPolitica();

  // ── Modo 1: apenas validar o formato da referência ────────────────────
  const somenteVerificar = lerOpcao(args, "--verificar");
  if (somenteVerificar) {
    const v = ehDigestValido(politica, somenteVerificar);
    if (!v.valido) {
      console.error(
        `RECUSADO: "${somenteVerificar}" não é uma referência por digest.\n` +
          `  Razão: ${v.razao}\n` +
          "  Uma tag é um PONTEIRO MUTÁVEL: `app:v1.2.3` pode apontar para outra\n" +
          "  imagem amanhã, sem nenhum diff, sem nenhum rastro. Promover por tag é\n" +
          "  THR-0051 — o artefato implantado deixa de ser o artefato construído e\n" +
          "  verificado. Use `nome@sha256:<64 hexadecimais>` (ADR-0022 S7; ADR-0019 P3).",
      );
      return 1;
    }
    console.log(`ACEITO: referência por digest imutável — ${somenteVerificar}`);
    return 0;
  }

  // ── Modo 2: promoção ──────────────────────────────────────────────────
  const artefato = lerOpcao(args, "--artefato");
  const origem = lerOpcao(args, "--de");
  const destino = lerOpcao(args, "--para");

  if (!artefato || !origem || !destino) {
    console.error(
      "uso: node scripts/promover-por-digest.mjs --artefato <ref@sha256:...> " +
        "--de <ambiente> --para <ambiente> [--evidencia <arquivo.json>]\n" +
        "     node scripts/promover-por-digest.mjs --verificar <referencia>",
    );
    return 1;
  }

  const bloqueios = [];
  const verificacoes = [];

  // Pré-condição 1 — referência por digest.
  const v = ehDigestValido(politica, artefato);
  verificacoes.push({ nome: "referência por digest imutável", ok: v.valido, detalhe: v.razao });
  if (!v.valido) {
    bloqueios.push(
      `referência "${artefato}" recusada: ${v.razao} Promoção exige digest ` +
        "(ADR-0022 S7; ADR-0019 P3; THR-0051).",
    );
  }

  // Pré-condição 2 — o ambiente de destino existe de fato.
  const provisionados = politica.promocao.ambientes_provisionados ?? [];
  const nomeadosNaoProvisionados = politica.promocao.ambientes_nomeados_nao_provisionados ?? [];
  const destinoOk = provisionados.includes(destino);
  verificacoes.push({ nome: `ambiente de destino "${destino}" provisionado`, ok: destinoOk });
  if (!destinoOk) {
    bloqueios.push(
      `ambiente "${destino}" NÃO está provisionado. Provisionados hoje: ` +
        `${provisionados.length === 0 ? "(nenhum)" : provisionados.join(", ")}. ` +
        `Nomeados e reservados, mas não provisionados: ${nomeadosNaoProvisionados.join(", ")}. ` +
        "ADR-0019 §5.2 P1 — só existem hoje desenvolvimento local e CI efêmero; " +
        "provisionar depende de ADR-0019 §5.1 C1/C2/C3, todas ABERTAS.",
    );
  }

  // Pré-condição 3 — assinatura.
  if (politica.promocao.exige_assinatura_verificada) {
    const a = verificarAssinatura(artefato);
    verificacoes.push({ nome: "assinatura verificada", ok: a.ok, detalhe: a.detalhe });
    if (!a.ok) bloqueios.push(`assinatura não verificada: ${a.detalhe}`);
  }

  // Pré-condição 4 — proveniência.
  if (politica.promocao.exige_proveniencia_verificada) {
    const p = verificarProveniencia(artefato);
    verificacoes.push({ nome: "proveniência verificada", ok: p.ok, detalhe: p.detalhe });
    if (!p.ok) bloqueios.push(`proveniência não verificada: ${p.detalhe}`);
  }

  // ── Pacote de evidência ───────────────────────────────────────────────
  // Emitido inclusive (e sobretudo) quando a promoção é recusada: a recusa
  // também é evidência, e é a que MG-G8-PROD vai querer ler.
  const evidencia = {
    tipo: "tentativa-de-promocao-por-digest",
    resultado: bloqueios.length === 0 ? "PRE-CONDICOES-SATISFEITAS" : "BLOQUEADO",
    artefato,
    origem,
    destino,
    verificacoes,
    bloqueios,
    natureza:
      "Fatia sintética e consultiva. Este registro NÃO é evidência de release de " +
      "produção, NÃO alega conformidade e NÃO altera o estado de 0 vias clínicas " +
      "acionáveis / safety case M0.",
    rastreio: ["ADR-0019 §5.2 P1/P3/P7", "ADR-0022 §5.2 S7/S8", "ADR-0022 §8.3", "THR-0051"],
  };
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    evidencia.instante = new Date(Number(epoch) * 1000).toISOString();
  }

  const caminhoEvidencia = lerOpcao(args, "--evidencia");
  if (caminhoEvidencia) {
    const abs = resolve(RAIZ, caminhoEvidencia);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, `${JSON.stringify(evidencia, null, 2)}\n`, "utf8");
    console.log(`Pacote de evidência escrito em ${caminhoEvidencia}`);
  }

  console.log("\n=== Promoção por digest — pré-condições ===");
  for (const c of verificacoes) {
    console.log(`  ${c.ok ? "ok  " : "BLOQ"} ${c.nome}${c.detalhe ? ` — ${c.detalhe}` : ""}`);
  }

  if (bloqueios.length > 0) {
    console.error(
      `\nPROMOÇÃO BLOQUEADA — ${bloqueios.length} pré-condição(ões) não satisfeita(s):`,
    );
    for (const b of bloqueios) console.error(`  ✗ ${b}`);
    console.error(
      "\nNenhum artefato foi promovido. Isto é o comportamento correto, não uma falha\n" +
        "do script: ADR-0022 §8.3 proíbe promover qualquer artefato desta V2 além de\n" +
        "dev/CI efêmero enquanto S8 (SBOM, proveniência, assinatura) não fechar.",
    );
    return 1;
  }

  console.log(
    "\nPré-condições satisfeitas para o MESMO digest — nenhuma reconstrução por " +
      "ambiente (ADR-0019 P3).\nATENÇÃO: satisfazer pré-condição não é promover. A " +
      "execução da promoção depende do registro de artefato (ADR-0022 §5.1 C2) e da " +
      "autoridade de go-live (MG-G8-PROD), que não é o dono do pipeline.",
  );
  return 0;
}

process.exit(main());
