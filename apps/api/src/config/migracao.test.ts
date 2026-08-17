/**
 * Estratégia de migração: lock de exclusão mútua, timeout, verificação de
 * compatibilidade e rollback/roll-forward TESTÁVEL (§6.3 do despacho ACH-03).
 *
 * OBSERVED antes de escrever este arquivo: `packages/persistencia/src/session.ts`
 * aplica `0001_init.sql` e `0002_g7_integration.sql` em sequência, sem lock,
 * sem tabela de versão, sem timeout e sem reversão — `grep -rni
 * "advisory|lock|timeout|schema_version|rollback" packages/persistencia/src`
 * não retorna nenhuma implementação. ADR-0019 §2.1 E2 exige "rodar migrações
 * com estratégia de rollback"; ADR-0020 §6 liga migração ao restore ensaiado.
 *
 * O orquestrador aqui é deliberadamente PURO de driver: fala com uma
 * `PortaMigracao` que o adaptador PostgreSQL real (agente
 * `ic-fronteira-postgres-rls`) implementa. Isso é o que torna rollback,
 * timeout e contenção de lock asseveráveis sem um banco — e o que impede que
 * uma conclusão obtida sob PGlite seja generalizada para PostgreSQL de
 * produção (anti-padrão 6).
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  executarMigracao,
  type PassoMigracao,
  type PlanoMigracao,
  type PortaMigracao,
  verificarCompatibilidade,
} from "./index.js";

function passo(versao: number, extra: Partial<PassoMigracao> = {}): PassoMigracao {
  return {
    versao,
    nome: `000${versao}_sintetica.sql`,
    destrutiva: false,
    reversivel: true,
    ...extra,
  };
}

const PASSOS = [passo(1), passo(2), passo(3)];

/** Promessas pendentes criadas pelos casos de timeout, encerradas no afterEach. */
const pendentes: Array<() => void> = [];

function nuncaResolve<T>(): Promise<T> {
  return new Promise<T>((resolve) => {
    pendentes.push(() => resolve(undefined as unknown as T));
  });
}

afterEach(() => {
  for (const encerrar of pendentes.splice(0)) encerrar();
});

class PortaFalsa implements PortaMigracao {
  versaoNoBanco: number;
  readonly aplicados: number[] = [];
  readonly revertidos: number[] = [];
  aquisicoes = 0;
  liberacoes = 0;
  lockOcupado = false;
  lockTrava = false;
  aplicarTrava: number | null = null;
  aplicarFalha: number | null = null;
  reverterFalha = false;

  constructor(versaoNoBanco: number) {
    this.versaoNoBanco = versaoNoBanco;
  }

  async adquirirLock(): Promise<boolean> {
    this.aquisicoes += 1;
    if (this.lockTrava) return nuncaResolve<boolean>();
    return !this.lockOcupado;
  }

  async liberarLock(): Promise<void> {
    this.liberacoes += 1;
  }

  async versaoAplicada(): Promise<number> {
    return this.versaoNoBanco;
  }

  async aplicar(p: PassoMigracao): Promise<void> {
    if (this.aplicarTrava === p.versao) return nuncaResolve<void>();
    if (this.aplicarFalha === p.versao) throw new Error("falha sintética ao aplicar");
    this.aplicados.push(p.versao);
    this.versaoNoBanco = p.versao;
  }

  async reverter(p: PassoMigracao): Promise<void> {
    if (this.reverterFalha) throw new Error("falha sintética ao reverter");
    this.revertidos.push(p.versao);
    this.versaoNoBanco = p.versao - 1;
  }
}

function plano(extra: Partial<PlanoMigracao> = {}): PlanoMigracao {
  return {
    perfil: "staging",
    modo: "aplicar",
    passos: PASSOS,
    versaoExigidaPeloCodigo: 3,
    lockId: 20260817,
    timeoutMs: 40,
    permitirDestrutiva: false,
    janelaCompatibilidade: 5,
    ...extra,
  };
}

describe("verificação de compatibilidade de versão de schema", () => {
  it("aceita banco na mesma versão do código", () => {
    expect(verificarCompatibilidade(3, 3, 5).veredito).toBe("em-dia");
  });

  it("recusa banco À FRENTE do código — implantação antiga contra schema novo", () => {
    const r = verificarCompatibilidade(4, 3, 5);
    expect(r.veredito).toBe("incompativel");
    expect(r.motivo).toContain("à frente");
  });

  it("aceita defasagem dentro da janela e recusa fora dela", () => {
    expect(verificarCompatibilidade(2, 3, 5).veredito).toBe("pendente");
    expect(verificarCompatibilidade(0, 9, 5).veredito).toBe("incompativel");
  });
});

describe("roll-forward sob lock, com liberação garantida", () => {
  it("aplica os passos pendentes em ordem crescente e libera o lock", async () => {
    const porta = new PortaFalsa(1);
    const r = await executarMigracao(porta, plano());
    expect(r.desfecho).toBe("aplicada");
    expect(porta.aplicados).toEqual([2, 3]);
    expect(porta.aquisicoes).toBe(1);
    expect(porta.liberacoes).toBe(1);
  });

  it("não adquire lock nem aplica nada quando já está em dia", async () => {
    const porta = new PortaFalsa(3);
    const r = await executarMigracao(porta, plano());
    expect(r.desfecho).toBe("sem-mudanca");
    expect(porta.aquisicoes).toBe(0);
    expect(porta.aplicados).toEqual([]);
  });

  it("recusa sem tocar no banco quando o schema está à frente do código", async () => {
    const porta = new PortaFalsa(7);
    const r = await executarMigracao(porta, plano());
    expect(r.desfecho).toBe("incompativel");
    expect(porta.aquisicoes).toBe(0);
  });

  it("no modo verificar, migração pendente é incompatibilidade — nunca aplicação silenciosa", async () => {
    const porta = new PortaFalsa(1);
    const r = await executarMigracao(porta, plano({ modo: "verificar" }));
    expect(r.desfecho).toBe("incompativel");
    expect(porta.aplicados).toEqual([]);
    expect(porta.aquisicoes).toBe(0);
  });
});

describe("exclusão mútua e timeout", () => {
  it("desiste quando o lock está ocupado por outro processo, sem aplicar nada", async () => {
    const porta = new PortaFalsa(1);
    porta.lockOcupado = true;
    const r = await executarMigracao(porta, plano());
    expect(r).toMatchObject({ desfecho: "lock-indisponivel", motivo: "ocupado" });
    expect(porta.aplicados).toEqual([]);
    expect(porta.liberacoes).toBe(0);
  });

  it("expira a aquisição de lock e NÃO libera um lock que talvez não seja seu", async () => {
    const porta = new PortaFalsa(1);
    porta.lockTrava = true;
    const r = await executarMigracao(porta, plano({ timeoutMs: 30 }));
    expect(r).toMatchObject({ desfecho: "lock-indisponivel", motivo: "tempo-esgotado" });
    expect(porta.aplicados).toEqual([]);
    expect(porta.liberacoes).toBe(0);
  });

  it("expira um passo travado, trata o estado como desconhecido e reverte", async () => {
    const porta = new PortaFalsa(1);
    porta.aplicarTrava = 3;
    const r = await executarMigracao(porta, plano({ timeoutMs: 30 }));
    expect(r.desfecho).toBe("revertida");
    // O passo travado (3) é revertido junto com o já aplicado (2): estado
    // desconhecido é tratado como possivelmente aplicado.
    expect(porta.revertidos).toEqual([3, 2]);
    expect(porta.liberacoes).toBe(1);
  });
});

describe("rollback testável", () => {
  it("reverte em ordem inversa quando um passo falha e libera o lock", async () => {
    const porta = new PortaFalsa(0);
    porta.aplicarFalha = 3;
    const r = await executarMigracao(porta, plano());
    expect(r.desfecho).toBe("revertida");
    expect(porta.aplicados).toEqual([1, 2]);
    expect(porta.revertidos).toEqual([3, 2, 1]);
    expect(porta.liberacoes).toBe(1);
  });

  it("declara falha irreversível quando um passo envolvido não é reversível", async () => {
    const porta = new PortaFalsa(0);
    porta.aplicarFalha = 2;
    const passos = [passo(1), passo(2, { reversivel: false }), passo(3)];
    const r = await executarMigracao(porta, plano({ passos }));
    expect(r.desfecho).toBe("falha-irreversivel");
    expect(porta.revertidos).toEqual([]);
    expect(porta.liberacoes).toBe(1);
    if (r.desfecho !== "falha-irreversivel") return;
    expect(r.precondicaoBackup).toContain("backup");
    expect(r.precondicaoBackup).toContain("ADR-0020");
  });

  it("declara falha irreversível quando a própria reversão falha", async () => {
    const porta = new PortaFalsa(0);
    porta.aplicarFalha = 3;
    porta.reverterFalha = true;
    const r = await executarMigracao(porta, plano());
    expect(r.desfecho).toBe("falha-irreversivel");
    expect(porta.liberacoes).toBe(1);
  });
});

describe("migração destrutiva é barrada por padrão", () => {
  it("recusa passo destrutivo sem autorização explícita e nomeia a pré-condição de backup", async () => {
    const porta = new PortaFalsa(1);
    const passos = [passo(1), passo(2), passo(3, { destrutiva: true })];
    const r = await executarMigracao(porta, plano({ passos }));
    expect(r.desfecho).toBe("incompativel");
    expect(porta.aquisicoes).toBe(0);
    if (r.desfecho !== "incompativel") return;
    expect(r.motivo).toContain("IC_MIGRACAO_PERMITIR_DESTRUTIVA");
    expect(r.motivo).toContain("backup");
  });

  it("aplica passo destrutivo quando explicitamente autorizado", async () => {
    const porta = new PortaFalsa(1);
    const passos = [passo(1), passo(2), passo(3, { destrutiva: true })];
    const r = await executarMigracao(porta, plano({ passos, permitirDestrutiva: true }));
    expect(r.desfecho).toBe("aplicada");
    expect(porta.aplicados).toEqual([2, 3]);
  });
});
