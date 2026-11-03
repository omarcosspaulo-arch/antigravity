import React from "react";
import { useCurrentFrame } from "remotion";
import { chaves } from "../anim";
import { Camera, Palco } from "../mundo/base";
import { Escritorio } from "../mundo/Escritorio";
import type { PropsCena } from "./tipos";

// f02 — "Ele trabalha há vinte anos numa grande empresa do Japão."
export const CenaEscritorio: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const D = cena.duracao;
  const pos = chaves(f, [0, D], [[4.6, 6.2, 12.5], [1.4, 2.5, 6.2]]);
  const alvo = chaves(f, [0, D], [[0, 0.6, -1.0], [0, 1.25, 0.5]]);
  return (
    <Palco fundo="#ffd98a" luz={{ alcanceSombra: 9, posicao: [-5, 10, 7] }}>
      <Camera pos={pos} alvo={alvo} fov={36} />
      <Escritorio tanaka={{ expressao: "feliz", pose: "digitando", ritmo: 1.2 }} />
    </Palco>
  );
};
