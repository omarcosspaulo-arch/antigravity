import React from "react";
import { useCurrentFrame } from "remotion";
import { anim, chaves } from "../anim";
import { quando } from "../timeline";
import { Camera, Palco } from "../mundo/base";
import { EstacaoTanaka, Sala } from "../mundo/Sala";
import type { PropsCena } from "./tipos";

// f01 — "Esse homem vai trabalhar todo dia... pra não fazer absolutamente nada."
export const Gancho: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const nada = quando(cena, "nada", 1, cena.duracao - 20);
  const soco = anim(f, [nada - 2, nada + 6], [0, 1]);
  const pos = chaves(f, [0, nada], [[2.3, 2.5, 6.6], [1.0, 1.75, 3.6]]);
  return (
    <Palco>
      <Camera pos={[pos[0] - soco * 0.25, pos[1] - soco * 0.08, pos[2] - soco * 0.9]} alvo={[0, 1.25, -1.2]} fov={34} />
      <Sala horas={9 + f / 30 / 60}>
        <EstacaoTanaka personagem={{ expressao: "neutro", pose: "sentado", olhar: [0.2, 0] }} />
      </Sala>
    </Palco>
  );
};
