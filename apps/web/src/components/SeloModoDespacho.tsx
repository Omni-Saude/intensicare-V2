/**
 * apps/web/src/components/SeloModoDespacho.tsx
 *
 * A REPRESENTAÇÃO VISÍVEL DO MODO DE DESPACHO (LAC-L2) — fechamento do lado
 * frontend de um campo que o backend já publicava e que o cliente descartava.
 *
 * POR QUE ISTO PRECISA EXISTIR. `QAS-0023` mede "count of degradations with no
 * user-visible representation: must be zero". A regra clínica desta fatia roda
 * em SOMBRA (0 vias clínicas acionáveis), o backend declara isso em cada
 * avaliação e em cada linha da grade — e nada disso chegava à tela. O único
 * sinal era o literal fixo "CONSULTIVO" de `BannerContexto.tsx`, escrito à mão:
 * verdadeiro por coincidência hoje, e mudo no dia em que o modo mudasse. Um
 * aviso que não deriva do campo não é representação da degradação; é decoração
 * que casa com ela.
 *
 * QUEM ESCREVE O QUÊ (ADR-0008 N3, ADR-0021 F1/F3):
 *   - o TEXTO da situação declarada é do SERVIDOR (`rotuloPt`,
 *     `mensagemRecusaPt`), exibido verbatim — este componente não redige uma
 *     segunda versão dele;
 *   - o TOM, o glifo e os identificadores de máquina são do frontend;
 *   - a acionabilidade exibida é `situacaoDeDespacho`, que só sabe rebaixar:
 *     ausente, `null` ou incoerente ⇒ NÃO acionável, sempre (contrato
 *     `packages/contratos/src/index.ts:260-267`).
 *
 * ANÚNCIO POLIDO (`role="status"`). Este selo é persistente e acompanha toda
 * avaliação em tela; reservar o canal assertivo ao clinicamente urgente é a
 * mesma decisão já tomada em `IndicadorConectividade` e `AvisoProntidao`
 * (IA-P2/HAZ-0037). No cartão da grade ele nem sequer é live region: N cartões
 * anunciando o mesmo fato a cada releitura seria a rajada que HAZ-0037 proíbe.
 *
 * Rastreio: LAC-L2, QAS-0023, ADR-0007 eixo 4, ADR-0008 §8.3, ADR-0011 P7,
 * ADR-0021 F1/F3/F4, ADR-0029 C2 (texto do frontend PROVISÓRIO), HAZ-0037.
 */
import type { ModoDeDespachoAvaliacao } from "@intensicare/contratos";
import { situacaoDeDespacho } from "../domain/clinico.js";
import { textoModoDespacho } from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

interface SeloModoDespachoProps {
  /** Envelope publicado pelo backend; `null`/ausente ⇒ modo NÃO registrado. */
  envelope: ModoDeDespachoAvaliacao | null | undefined;
  /**
   * `true` na tela de detalhe: acrescenta a mensagem de recusa do servidor e
   * anuncia por `role="status"`. O cartão da grade fica compacto e mudo para
   * leitores de tela em releitura — o texto continua visível e legível.
   */
  detalhado?: boolean;
}

export function SeloModoDespacho({ envelope, detalhado = false }: SeloModoDespachoProps) {
  const situacao = situacaoDeDespacho(envelope);
  const rotuloDoServidor = situacao === "incoerente" ? null : (envelope?.rotuloPt ?? null);
  const { texto, tom } = textoModoDespacho(situacao, rotuloDoServidor);

  // A acionabilidade EXIBIDA nunca é `envelope.acionavel` cru: um payload
  // forjado declarando `true` sobre um modo `sombra` renderizaria como
  // acionável, que é o dano exato que este selo existe para impedir.
  const acionavel = situacao === "acionavel";

  /*
    A mensagem de recusa é texto pt-BR VISÍVEL redigido pelo servidor a partir
    de vocabulário FECHADO (`MotivoRecusaDespacho`). Ela só aparece quando a
    situação é a que o servidor declarou — numa incoerência, citar o texto do
    envelope seria emprestar-lhe a autoridade que ele não tem.
  */
  const mensagemRecusa =
    detalhado && situacao !== "incoerente" ? (envelope?.mensagemRecusaPt ?? null) : null;

  return (
    <div
      className="selo-modo-despacho"
      data-testid="modo-despacho"
      data-situacao-despacho={situacao}
      data-acionavel={String(acionavel)}
      data-modo-despacho={envelope?.modo ?? ""}
      data-desfecho-despacho={envelope?.desfecho ?? ""}
      data-motivo-recusa={envelope?.motivoRecusa ?? ""}
      {...(detalhado ? { role: "status", "aria-live": "polite" as const } : {})}
    >
      <BadgeTom texto={texto} tom={tom} />
      {mensagemRecusa !== null && mensagemRecusa !== "" && (
        <p className="selo-modo-despacho__recusa">{mensagemRecusa}</p>
      )}
    </div>
  );
}
