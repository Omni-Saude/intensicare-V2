/**
 * Cliente MÍNIMO do protocolo de mensagens do PostgreSQL (frontend/backend
 * versão 3.0), sobre TCP, sem nenhuma dependência npm.
 *
 * POR QUE ESCREVER ISTO EM VEZ DE USAR UM DRIVER PRONTO
 * -----------------------------------------------------
 * A fronteira de isolamento por tenant deste repositório precisa ser provada
 * contra um PostgreSQL REAL, com uma IDENTIDADE DE CONEXÃO real (ver
 * `docs/11-security-privacy-compliance/verificacao-de-controles-fatia-g7.md`,
 * ADR-0016 §4.1, THR-0050). Isso exige um cliente que fale o protocolo de
 * verdade, incluindo autenticação SCRAM-SHA-256 — porque parte da prova é
 * que a CREDENCIAL da aplicação não autentica como superusuário.
 *
 * PREMISSA (reversível, ADR-0016 / regime GDEC-0015-GDEC-0017): adotar um
 * driver de terceiros (`pg`, `postgres`) seria a escolha natural, mas
 * acrescentar dependência exige alterar `pnpm-lock.yaml`, um arquivo
 * compartilhado, e a decisão de dependência de runtime de produção não é de
 * um agente. Este módulo é escrito para ser SUBSTITUÍVEL: tudo o que o resto
 * do pacote consome está atrás da porta em `./porta.ts`, e trocar este
 * arquivo por um adaptador sobre `pg` não toca nenhum consumidor.
 *
 * ESCOPO HONESTO DO QUE ESTE CLIENTE É E NÃO É
 * ---------------------------------------------
 * É: conexão TCP, autenticação (`trust`, senha em claro, MD5, SCRAM-SHA-256),
 * consulta simples, consulta estendida com parâmetros vinculados
 * (Parse/Bind/Describe/Execute/Sync), decodificação textual de resultados,
 * propagação fiel de erro do servidor (código SQLSTATE + mensagem).
 *
 * NÃO é: TLS, pipelining, COPY em volume, tipos binários, `LISTEN/NOTIFY`,
 * cursores nomeados, nem cliente de alto desempenho. Não deve ser
 * apresentado como driver de produção verificado — nenhuma alegação de
 * segurança ou de conformidade deriva DELE; as alegações derivam do que o
 * SERVIDOR PostgreSQL impõe e que a suíte observa através dele.
 *
 * Referência normativa: PostgreSQL 16, "Frontend/Backend Protocol"; SCRAM
 * conforme RFC 5802 e RFC 7677 (mecanismo `SCRAM-SHA-256`, sem ligação de
 * canal — o cliente não negocia TLS, então `SCRAM-SHA-256-PLUS` não se
 * aplica).
 */

import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { createConnection, type Socket } from "node:net";

/** Versão do protocolo: 3.0 codificado como (3 << 16) | 0. */
const VERSAO_PROTOCOLO = 196_608;

/** Limite padrão de espera por resposta do servidor, por operação. */
const TEMPO_LIMITE_PADRAO_MS = 30_000;

/**
 * Identificadores de tipo (OID) decodificados para valor JavaScript nativo.
 * Tudo o que não estiver aqui é entregue como `string` — decodificar a menos
 * é preferível a decodificar errado.
 */
const OID_BOOLEANO = 16;
const OIDS_INTEIROS = new Set([20, 21, 23, 26]);
const OIDS_REAIS = new Set([700, 701, 1700]);
const OIDS_JSON = new Set([114, 3802]);

/** Erro devolvido PELO SERVIDOR (ErrorResponse), com o SQLSTATE preservado. */
export class ErroPostgres extends Error {
  readonly codigo: string;
  readonly severidade: string;
  readonly detalhe: string | undefined;
  readonly dica: string | undefined;
  readonly tabela: string | undefined;

  constructor(campos: ReadonlyMap<string, string>) {
    super(campos.get("M") ?? "erro desconhecido do PostgreSQL");
    this.name = "ErroPostgres";
    this.codigo = campos.get("C") ?? "";
    this.severidade = campos.get("V") ?? campos.get("S") ?? "ERROR";
    this.detalhe = campos.get("D");
    this.dica = campos.get("H");
    this.tabela = campos.get("t");
  }
}

/** Erro do CLIENTE (transporte, autenticação, protocolo) — nunca do servidor. */
export class ErroConexaoPostgres extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem, opcoes);
    this.name = "ErroConexaoPostgres";
  }
}

/**
 * Descrição de coluna. O nome do campo (`name`/`dataTypeID`) é o do PGlite,
 * de propósito — ver nota em `ResultadoSql`.
 */
export interface CampoResultado {
  readonly name: string;
  readonly dataTypeID: number;
}

/**
 * Forma do resultado, DELIBERADAMENTE idêntica à do PGlite (`Results<T>`):
 * `rows`, `affectedRows`, `fields`. Manter a mesma forma é o que permite que
 * os repositórios já existentes deste pacote (`repositories/*.ts`, escritos
 * contra o tipo `Transaction` do PGlite) rodem SEM ALTERAÇÃO sobre
 * PostgreSQL real — a troca de adaptador não reescreve consumidor.
 */
export interface ResultadoSql<T = Record<string, unknown>> {
  readonly rows: T[];
  readonly affectedRows: number;
  readonly fields: CampoResultado[];
}

export interface OpcoesConexao {
  readonly host: string;
  readonly porta: number;
  readonly usuario: string;
  readonly senha?: string | undefined;
  readonly banco: string;
  readonly nomeAplicacao?: string;
  readonly tempoLimiteMs?: number;
}

interface Mensagem {
  readonly tipo: string;
  readonly corpo: Buffer;
}

/** Construtor incremental de corpo de mensagem (inteiros e cadeias C). */
class Escritor {
  private pedacos: Buffer[] = [];

  int16(valor: number): this {
    const b = Buffer.alloc(2);
    b.writeInt16BE(valor, 0);
    this.pedacos.push(b);
    return this;
  }

  int32(valor: number): this {
    const b = Buffer.alloc(4);
    b.writeInt32BE(valor, 0);
    this.pedacos.push(b);
    return this;
  }

  /** Cadeia terminada em NUL, como o protocolo exige. */
  cadeia(valor: string): this {
    this.pedacos.push(Buffer.from(`${valor}\0`, "utf-8"));
    return this;
  }

  bytes(valor: Buffer): this {
    this.pedacos.push(valor);
    return this;
  }

  concluir(): Buffer {
    return Buffer.concat(this.pedacos);
  }
}

/** Empacota corpo + cabeçalho (byte de tipo + comprimento incluindo a si). */
function enquadrar(tipo: string, corpo: Buffer): Buffer {
  const cabecalho = Buffer.alloc(5);
  cabecalho.write(tipo, 0, "latin1");
  cabecalho.writeInt32BE(corpo.length + 4, 1);
  return Buffer.concat([cabecalho, corpo]);
}

/** Lê a sequência de cadeias C de um corpo, a partir de um deslocamento. */
function lerCadeias(corpo: Buffer, inicio: number): string[] {
  const saida: string[] = [];
  let cursor = inicio;
  while (cursor < corpo.length) {
    const fim = corpo.indexOf(0, cursor);
    if (fim < 0) {
      break;
    }
    if (fim === cursor) {
      break;
    }
    saida.push(corpo.toString("utf-8", cursor, fim));
    cursor = fim + 1;
  }
  return saida;
}

/** Campos de ErrorResponse/NoticeResponse: pares <código><valor NUL>. */
function lerCamposDeErro(corpo: Buffer): Map<string, string> {
  const campos = new Map<string, string>();
  let cursor = 0;
  while (cursor < corpo.length) {
    const codigo = corpo.toString("latin1", cursor, cursor + 1);
    if (codigo === "\0") {
      break;
    }
    const fim = corpo.indexOf(0, cursor + 1);
    if (fim < 0) {
      break;
    }
    campos.set(codigo, corpo.toString("utf-8", cursor + 1, fim));
    cursor = fim + 1;
  }
  return campos;
}

/** Converte um parâmetro JavaScript para a representação TEXTUAL do protocolo. */
function codificarParametro(valor: unknown): Buffer | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  if (typeof valor === "string") {
    return Buffer.from(valor, "utf-8");
  }
  if (typeof valor === "number" || typeof valor === "bigint") {
    return Buffer.from(String(valor), "utf-8");
  }
  if (typeof valor === "boolean") {
    return Buffer.from(valor ? "t" : "f", "utf-8");
  }
  if (valor instanceof Date) {
    return Buffer.from(valor.toISOString(), "utf-8");
  }
  if (Buffer.isBuffer(valor)) {
    return Buffer.from(`\\x${valor.toString("hex")}`, "utf-8");
  }
  // Objeto/array: representação JSON — é o que as colunas `jsonb` deste
  // esquema esperam (instantes clínicos multi-campo, payloads de outbox).
  return Buffer.from(JSON.stringify(valor), "utf-8");
}

/** Decodifica um valor textual conforme o OID declarado na RowDescription. */
function decodificarValor(texto: string | null, oid: number): unknown {
  if (texto === null) {
    return null;
  }
  if (oid === OID_BOOLEANO) {
    return texto === "t";
  }
  if (OIDS_INTEIROS.has(oid) || OIDS_REAIS.has(oid)) {
    const numero = Number(texto);
    return Number.isNaN(numero) ? texto : numero;
  }
  if (OIDS_JSON.has(oid)) {
    try {
      return JSON.parse(texto) as unknown;
    } catch {
      return texto;
    }
  }
  return texto;
}

/** Extrai o número de linhas afetadas da etiqueta de CommandComplete. */
function linhasAfetadas(etiqueta: string): number {
  const partes = etiqueta.trim().split(" ");
  const ultima = partes.at(-1);
  const numero = ultima === undefined ? Number.NaN : Number(ultima);
  return Number.isFinite(numero) ? numero : 0;
}

/**
 * Canal de mensagens: acumula bytes do soquete, desenquadra mensagens
 * completas e as entrega, em ordem, a quem estiver esperando.
 */
class Canal {
  private acumulado: Buffer = Buffer.alloc(0);
  private readonly prontas: Mensagem[] = [];
  private readonly esperando: {
    cumprir: (m: Mensagem) => void;
    rejeitar: (e: Error) => void;
  }[] = [];
  private falha: Error | null = null;
  private encerradoPeloCliente = false;

  constructor(
    private readonly soquete: Socket,
    private readonly tempoLimiteMs: number,
  ) {
    soquete.on("data", (pedaco: Buffer) => this.aoReceber(pedaco));
    soquete.on("error", (erro: Error) => this.abortar(erro));
    soquete.on("close", () => {
      if (!this.encerradoPeloCliente) {
        this.abortar(new ErroConexaoPostgres("conexão encerrada pelo servidor"));
      }
    });
  }

  private aoReceber(pedaco: Buffer): void {
    this.acumulado = Buffer.concat([this.acumulado, pedaco]);
    while (this.acumulado.length >= 5) {
      const comprimento = this.acumulado.readInt32BE(1);
      const total = comprimento + 1;
      if (this.acumulado.length < total) {
        break;
      }
      const mensagem: Mensagem = {
        tipo: this.acumulado.toString("latin1", 0, 1),
        corpo: this.acumulado.subarray(5, total),
      };
      this.acumulado = this.acumulado.subarray(total);
      const proximo = this.esperando.shift();
      if (proximo) {
        proximo.cumprir(mensagem);
      } else {
        this.prontas.push(mensagem);
      }
    }
  }

  private abortar(erro: Error): void {
    this.falha = erro;
    while (this.esperando.length > 0) {
      this.esperando.shift()?.rejeitar(erro);
    }
  }

  marcarEncerrado(): void {
    this.encerradoPeloCliente = true;
  }

  enviar(dados: Buffer): void {
    if (this.falha) {
      throw this.falha;
    }
    this.soquete.write(dados);
  }

  /**
   * Próxima mensagem do servidor. O limite de tempo é deliberado: sem ele,
   * um servidor que nunca responde deixaria a suíte pendurada em vez de
   * falhar alto — e suíte pendurada é pior que suíte vermelha.
   */
  proxima(): Promise<Mensagem> {
    const pronta = this.prontas.shift();
    if (pronta) {
      return Promise.resolve(pronta);
    }
    if (this.falha) {
      return Promise.reject(this.falha);
    }
    return new Promise<Mensagem>((cumprir, rejeitar) => {
      const cronometro = setTimeout(() => {
        const indice = this.esperando.findIndex((e) => e.cumprir === envolvido);
        if (indice >= 0) {
          this.esperando.splice(indice, 1);
        }
        rejeitar(
          new ErroConexaoPostgres(
            `sem resposta do PostgreSQL em ${this.tempoLimiteMs} ms (operação abortada)`,
          ),
        );
      }, this.tempoLimiteMs);
      const envolvido = (m: Mensagem): void => {
        clearTimeout(cronometro);
        cumprir(m);
      };
      this.esperando.push({
        cumprir: envolvido,
        rejeitar: (e) => {
          clearTimeout(cronometro);
          rejeitar(e);
        },
      });
    });
  }
}

/** Estado acumulado enquanto se lê um conjunto de resultados. */
interface Acumulador {
  campos: CampoResultado[];
  linhas: Record<string, unknown>[];
  afetadas: number;
  erro: ErroPostgres | null;
}

function acumuladorVazio(): Acumulador {
  return { campos: [], linhas: [], afetadas: 0, erro: null };
}

/**
 * Conexão com um servidor PostgreSQL. Uma conexão executa UMA operação por
 * vez: as chamadas são serializadas internamente numa fila, porque o
 * protocolo é estritamente sequencial por conexão.
 */
export class ConexaoPostgres {
  private fila: Promise<unknown> = Promise.resolve();
  private fechada = false;
  private readonly parametros = new Map<string, string>();

  private constructor(
    private readonly soquete: Socket,
    private readonly canal: Canal,
    readonly usuarioAutenticado: string,
    readonly banco: string,
  ) {}

  /** Abre o soquete, executa o aperto de mão e autentica. */
  static async conectar(opcoes: OpcoesConexao): Promise<ConexaoPostgres> {
    const tempoLimiteMs = opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS;
    const soquete = await new Promise<Socket>((cumprir, rejeitar) => {
      const s = createConnection({ host: opcoes.host, port: opcoes.porta });
      const cronometro = setTimeout(() => {
        s.destroy();
        rejeitar(
          new ErroConexaoPostgres(
            `não foi possível conectar em ${opcoes.host}:${opcoes.porta} em ${tempoLimiteMs} ms`,
          ),
        );
      }, tempoLimiteMs);
      s.once("connect", () => {
        clearTimeout(cronometro);
        s.setNoDelay(true);
        cumprir(s);
      });
      s.once("error", (erro) => {
        clearTimeout(cronometro);
        rejeitar(new ErroConexaoPostgres(`falha ao conectar: ${erro.message}`, { cause: erro }));
      });
    });

    const canal = new Canal(soquete, tempoLimiteMs);
    const conexao = new ConexaoPostgres(soquete, canal, opcoes.usuario, opcoes.banco);
    try {
      await conexao.apertoDeMao(opcoes);
    } catch (erro) {
      canal.marcarEncerrado();
      soquete.destroy();
      throw erro;
    }
    return conexao;
  }

  private async apertoDeMao(opcoes: OpcoesConexao): Promise<void> {
    const corpo = new Escritor()
      .int32(VERSAO_PROTOCOLO)
      .cadeia("user")
      .cadeia(opcoes.usuario)
      .cadeia("database")
      .cadeia(opcoes.banco)
      .cadeia("application_name")
      .cadeia(opcoes.nomeAplicacao ?? "intensicare-persistencia")
      .cadeia("client_encoding")
      .cadeia("UTF8")
      .bytes(Buffer.from([0]))
      .concluir();
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeInt32BE(corpo.length + 4, 0);
    this.canal.enviar(Buffer.concat([cabecalho, corpo]));

    for (;;) {
      const mensagem = await this.canal.proxima();
      switch (mensagem.tipo) {
        case "R":
          await this.responderAutenticacao(mensagem.corpo, opcoes);
          break;
        case "S": {
          const [chave, valor] = lerCadeias(mensagem.corpo, 0);
          if (chave !== undefined && valor !== undefined) {
            this.parametros.set(chave, valor);
          }
          break;
        }
        case "K":
          break;
        case "N":
          break;
        case "Z":
          return;
        case "E":
          throw new ErroPostgres(lerCamposDeErro(mensagem.corpo));
        default:
          throw new ErroConexaoPostgres(
            `mensagem inesperada durante o aperto de mão: '${mensagem.tipo}'`,
          );
      }
    }
  }

  private async responderAutenticacao(corpo: Buffer, opcoes: OpcoesConexao): Promise<void> {
    const codigo = corpo.readInt32BE(0);
    if (codigo === 0) {
      return;
    }
    const senha = opcoes.senha;
    if (senha === undefined || senha === "") {
      throw new ErroConexaoPostgres(
        `o servidor exigiu autenticação (código ${codigo}) e nenhuma senha foi fornecida para o usuário '${opcoes.usuario}'`,
      );
    }
    if (codigo === 3) {
      this.canal.enviar(enquadrar("p", new Escritor().cadeia(senha).concluir()));
      return;
    }
    if (codigo === 5) {
      const sal = corpo.subarray(4, 8);
      const interno = createHash("md5").update(`${senha}${opcoes.usuario}`, "utf-8").digest("hex");
      const externo = createHash("md5")
        .update(Buffer.concat([Buffer.from(interno, "utf-8"), sal]))
        .digest("hex");
      this.canal.enviar(enquadrar("p", new Escritor().cadeia(`md5${externo}`).concluir()));
      return;
    }
    if (codigo === 10) {
      await this.autenticarScram(corpo, opcoes.usuario, senha);
      return;
    }
    throw new ErroConexaoPostgres(
      `método de autenticação não suportado por este cliente mínimo (código ${codigo})`,
    );
  }

  /** SCRAM-SHA-256 sem ligação de canal (RFC 5802/7677). */
  private async autenticarScram(corpo: Buffer, usuario: string, senha: string): Promise<void> {
    const mecanismos = lerCadeias(corpo, 4);
    if (!mecanismos.includes("SCRAM-SHA-256")) {
      throw new ErroConexaoPostgres(
        `servidor não ofereceu SCRAM-SHA-256 (ofereceu: ${mecanismos.join(", ") || "nada"})`,
      );
    }

    const nonceCliente = randomBytes(18).toString("base64");
    const primeiraBare = `n=,r=${nonceCliente}`;
    const primeiraCompleta = `n,,${primeiraBare}`;
    const inicial = new Escritor()
      .cadeia("SCRAM-SHA-256")
      .int32(Buffer.byteLength(primeiraCompleta))
      .bytes(Buffer.from(primeiraCompleta, "utf-8"))
      .concluir();
    this.canal.enviar(enquadrar("p", inicial));

    const continuacao = await this.canal.proxima();
    if (continuacao.tipo === "E") {
      throw new ErroPostgres(lerCamposDeErro(continuacao.corpo));
    }
    if (continuacao.tipo !== "R" || continuacao.corpo.readInt32BE(0) !== 11) {
      throw new ErroConexaoPostgres("resposta SCRAM inesperada no passo de continuação");
    }
    const servidorPrimeira = continuacao.corpo.toString("utf-8", 4);
    const atributos = new Map<string, string>();
    for (const par of servidorPrimeira.split(",")) {
      const separador = par.indexOf("=");
      if (separador > 0) {
        atributos.set(par.slice(0, separador), par.slice(separador + 1));
      }
    }
    const nonceCombinado = atributos.get("r");
    const salBase64 = atributos.get("s");
    const iteracoes = Number(atributos.get("i"));
    if (!nonceCombinado || !salBase64 || !Number.isFinite(iteracoes)) {
      throw new ErroConexaoPostgres(
        `primeira mensagem do servidor SCRAM malformada: ${servidorPrimeira}`,
      );
    }
    if (!nonceCombinado.startsWith(nonceCliente)) {
      // Proteção contra um servidor que não reflete o nosso nonce — sinal
      // clássico de intermediário no canal.
      throw new ErroConexaoPostgres("servidor SCRAM não refletiu o nonce do cliente");
    }

    const senhaSalgada = pbkdf2Sync(
      Buffer.from(senha, "utf-8"),
      Buffer.from(salBase64, "base64"),
      iteracoes,
      32,
      "sha256",
    );
    const chaveCliente = createHmac("sha256", senhaSalgada).update("Client Key").digest();
    const chaveArmazenada = createHash("sha256").update(chaveCliente).digest();
    const finalSemProva = `c=biws,r=${nonceCombinado}`;
    const mensagemAutenticacao = `${primeiraBare},${servidorPrimeira},${finalSemProva}`;
    const assinaturaCliente = createHmac("sha256", chaveArmazenada)
      .update(mensagemAutenticacao)
      .digest();
    const prova = Buffer.alloc(chaveCliente.length);
    for (let i = 0; i < chaveCliente.length; i += 1) {
      prova.writeUInt8(chaveCliente.readUInt8(i) ^ assinaturaCliente.readUInt8(i), i);
    }
    const final = `${finalSemProva},p=${prova.toString("base64")}`;
    this.canal.enviar(enquadrar("p", Buffer.from(final, "utf-8")));

    const conclusao = await this.canal.proxima();
    if (conclusao.tipo === "E") {
      throw new ErroPostgres(lerCamposDeErro(conclusao.corpo));
    }
    if (conclusao.tipo !== "R" || conclusao.corpo.readInt32BE(0) !== 12) {
      throw new ErroConexaoPostgres("resposta SCRAM inesperada no passo final");
    }
    // Verificação da assinatura do servidor: confirma que o outro lado
    // realmente conhece a chave derivada da senha (autenticação mútua do
    // SCRAM). Falhar aqui é falha de autenticação, não detalhe cosmético.
    const servidorFinal = conclusao.corpo.toString("utf-8", 4);
    const assinaturaRecebida = /(?:^|,)v=([^,]+)/.exec(servidorFinal)?.[1];
    const chaveServidor = createHmac("sha256", senhaSalgada).update("Server Key").digest();
    const assinaturaEsperada = createHmac("sha256", chaveServidor)
      .update(mensagemAutenticacao)
      .digest();
    const recebida = assinaturaRecebida
      ? Buffer.from(assinaturaRecebida, "base64")
      : Buffer.alloc(0);
    if (
      recebida.length !== assinaturaEsperada.length ||
      !timingSafeEqual(recebida, assinaturaEsperada)
    ) {
      throw new ErroConexaoPostgres(
        `assinatura SCRAM do servidor não confere para o usuário '${usuario}'`,
      );
    }
  }

  /**
   * Consome mensagens até `ReadyForQuery`, montando o resultado. Erros do
   * servidor NÃO interrompem a leitura: o protocolo exige drenar até o
   * `ReadyForQuery`, senão a conexão fica dessincronizada para a operação
   * seguinte (e o sintoma apareceria num teste vizinho, não neste).
   */
  private async drenarAte(acumulador: Acumulador): Promise<Acumulador> {
    for (;;) {
      const mensagem = await this.canal.proxima();
      switch (mensagem.tipo) {
        case "T": {
          const quantidade = mensagem.corpo.readInt16BE(0);
          const campos: CampoResultado[] = [];
          let cursor = 2;
          for (let i = 0; i < quantidade; i += 1) {
            // Cada campo: nome NUL-terminado, OID da tabela (4), número da
            // coluna (2), OID DO TIPO (4), tamanho (2), modificador (4),
            // formato (2) — 18 bytes após o NUL do nome.
            const fim = mensagem.corpo.indexOf(0, cursor);
            const nome = mensagem.corpo.toString("utf-8", cursor, fim);
            const oid = mensagem.corpo.readInt32BE(fim + 1 + 4 + 2);
            campos.push({ name: nome, dataTypeID: oid });
            cursor = fim + 1 + 18;
          }
          acumulador.campos = campos;
          break;
        }
        case "D": {
          const quantidade = mensagem.corpo.readInt16BE(0);
          const linha: Record<string, unknown> = {};
          let cursor = 2;
          for (let i = 0; i < quantidade; i += 1) {
            const comprimento = mensagem.corpo.readInt32BE(cursor);
            cursor += 4;
            let texto: string | null = null;
            if (comprimento >= 0) {
              texto = mensagem.corpo.toString("utf-8", cursor, cursor + comprimento);
              cursor += comprimento;
            }
            const campo = acumulador.campos[i];
            if (campo) {
              linha[campo.name] = decodificarValor(texto, campo.dataTypeID);
            }
          }
          acumulador.linhas.push(linha);
          break;
        }
        case "C":
          acumulador.afetadas += linhasAfetadas(lerCadeias(mensagem.corpo, 0)[0] ?? "");
          break;
        case "E":
          acumulador.erro = new ErroPostgres(lerCamposDeErro(mensagem.corpo));
          break;
        case "Z":
          return acumulador;
        case "H":
        case "d":
        case "c":
        case "n":
        case "1":
        case "2":
        case "3":
        case "s":
        case "I":
        case "N":
        case "A":
          break;
        case "S": {
          const [chave, valor] = lerCadeias(mensagem.corpo, 0);
          if (chave !== undefined && valor !== undefined) {
            this.parametros.set(chave, valor);
          }
          break;
        }
        case "G":
          // COPY FROM STDIN: este cliente não alimenta dados; aborta o COPY
          // para não deixar a conexão presa esperando `CopyDone`.
          this.canal.enviar(enquadrar("f", new Escritor().cadeia("copy não suportado").concluir()));
          break;
        default:
          throw new ErroConexaoPostgres(`mensagem não tratada: '${mensagem.tipo}'`);
      }
    }
  }

  /** Serializa as operações: o protocolo é sequencial por conexão. */
  private enfileirar<T>(operacao: () => Promise<T>): Promise<T> {
    const proxima = this.fila.then(operacao, operacao);
    this.fila = proxima.then(
      () => undefined,
      () => undefined,
    );
    return proxima;
  }

  /**
   * Consulta simples (mensagem `Query`). Aceita MÚLTIPLOS comandos separados
   * por `;` e os executa numa transação implícita única — é assim que as
   * migrações são aplicadas atomicamente. Não aceita parâmetros vinculados.
   */
  executar(sql: string): Promise<ResultadoSql> {
    return this.enfileirar(async () => {
      this.garantirAberta();
      this.canal.enviar(enquadrar("Q", new Escritor().cadeia(sql).concluir()));
      const resultado = await this.drenarAte(acumuladorVazio());
      if (resultado.erro) {
        throw resultado.erro;
      }
      return { rows: resultado.linhas, affectedRows: resultado.afetadas, fields: resultado.campos };
    });
  }

  /**
   * Consulta estendida com parâmetros VINCULADOS (`$1`, `$2`, ...). Os valores
   * viajam fora do texto do comando — nunca por interpolação — e é por isso
   * que este é o caminho usado por tudo que toca dado de tenant.
   */
  consultar<T = Record<string, unknown>>(
    sql: string,
    parametros: readonly unknown[] = [],
  ): Promise<ResultadoSql<T>> {
    return this.enfileirar(async () => {
      this.garantirAberta();
      const parse = new Escritor().cadeia("").cadeia(sql).int16(0).concluir();
      const bind = new Escritor().cadeia("").cadeia("").int16(0).int16(parametros.length);
      for (const parametro of parametros) {
        const codificado = codificarParametro(parametro);
        if (codificado === null) {
          bind.int32(-1);
        } else {
          bind.int32(codificado.length).bytes(codificado);
        }
      }
      bind.int16(0);
      // Describe: byte discriminador ('P' = portal) seguido do NOME do portal
      // (vazio, terminado em NUL) — não de outra letra 'P'.
      const descreve = Buffer.concat([Buffer.from("P", "latin1"), Buffer.from([0])]);
      const executa = new Escritor().cadeia("").int32(0).concluir();
      this.canal.enviar(
        Buffer.concat([
          enquadrar("P", parse),
          enquadrar("B", bind.concluir()),
          enquadrar("D", descreve),
          enquadrar("E", executa),
          enquadrar("S", Buffer.alloc(0)),
        ]),
      );
      const resultado = await this.drenarAte(acumuladorVazio());
      if (resultado.erro) {
        throw resultado.erro;
      }
      return {
        rows: resultado.linhas as T[],
        affectedRows: resultado.afetadas,
        fields: resultado.campos,
      };
    });
  }

  private garantirAberta(): void {
    if (this.fechada) {
      throw new ErroConexaoPostgres("conexão já foi fechada");
    }
  }

  parametroDoServidor(nome: string): string | undefined {
    return this.parametros.get(nome);
  }

  /** Envia `Terminate` e derruba o soquete. Idempotente. */
  async fechar(): Promise<void> {
    if (this.fechada) {
      return;
    }
    this.fechada = true;
    this.canal.marcarEncerrado();
    try {
      this.canal.enviar(enquadrar("X", Buffer.alloc(0)));
    } catch {
      // Soquete já caiu: nada a terminar.
    }
    await new Promise<void>((cumprir) => {
      const finalizar = (): void => {
        this.soquete.destroy();
        cumprir();
      };
      this.soquete.once("close", finalizar);
      this.soquete.end();
      // Rede de segurança: se o servidor não fechar o soquete, não travamos.
      setTimeout(finalizar, 2_000).unref();
    });
  }
}

/**
 * Interpreta uma URL `postgresql://usuario:senha@host:porta/banco` no formato
 * de opções de conexão. Aceita `postgres://` como sinônimo.
 */
export function opcoesDaUrl(url: string, nomeAplicacao?: string): OpcoesConexao {
  let analisada: URL;
  try {
    analisada = new URL(url);
  } catch (erro) {
    throw new ErroConexaoPostgres(`URL de conexão inválida: ${url}`, { cause: erro });
  }
  if (analisada.protocol !== "postgresql:" && analisada.protocol !== "postgres:") {
    throw new ErroConexaoPostgres(
      `esquema de URL não suportado: ${analisada.protocol} (use postgresql://)`,
    );
  }
  const senha = analisada.password ? decodeURIComponent(analisada.password) : undefined;
  return {
    host: analisada.hostname || "127.0.0.1",
    porta: analisada.port ? Number(analisada.port) : 5432,
    usuario: decodeURIComponent(analisada.username) || "postgres",
    senha,
    banco: analisada.pathname.replace(/^\//, "") || "postgres",
    ...(nomeAplicacao === undefined ? {} : { nomeAplicacao }),
  };
}

/** Reescreve uma URL de conexão trocando usuário, senha e/ou banco. */
export function urlCom(
  url: string,
  troca: { usuario?: string; senha?: string; banco?: string },
): string {
  const analisada = new URL(url);
  if (troca.usuario !== undefined) {
    analisada.username = encodeURIComponent(troca.usuario);
  }
  if (troca.senha !== undefined) {
    analisada.password = encodeURIComponent(troca.senha);
  }
  if (troca.banco !== undefined) {
    analisada.pathname = `/${troca.banco}`;
  }
  return analisada.toString();
}
