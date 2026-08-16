import { glifoTom } from "../domain/linguagem.js";
import type { Tom } from "../domain/estados.js";

interface BadgeTomProps {
  texto: string;
  tom: Tom;
}

/**
 * Selo textual + glifo para qualquer par (texto, tom) produzido por
 * `../domain/linguagem.ts`. Nunca depende só de cor (prompt §11
 * "non-color-only cues"; ADR-0029 lista de ambiguidade proibida): o
 * glifo é redundante ao texto, e o texto é sempre lido por leitor de
 * tela mesmo que o glifo seja `aria-hidden`.
 */
export function BadgeTom({ texto, tom }: BadgeTomProps) {
  return (
    <span className={`badge-tom badge-tom--${tom}`}>
      <span className="badge-tom__glifo" aria-hidden="true">
        {glifoTom(tom)}
      </span>
      <span>{texto}</span>
    </span>
  );
}
