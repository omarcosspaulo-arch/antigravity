import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, chaves } from "../anim";
import { Contador, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { CABECA_TANAKA, EstacaoTanaka, Sala } from "../mundo/Sala";
import { COR } from "../paleta";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f16 — "E o mais louco? Tem gente que aguenta anos lá dentro."
// f17 — "E você... aguentaria?"
export const CenaFinal: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const [f16, f17] = cena.falas;
  const tAguenta = quando(cena, "aguenta", 1, f16.inicio + 30);
  const tDentro = quando(cena, "dentro", 1, f16.fim - 10);

  const anos = Math.round(anim(f, [tAguenta, tDentro + 6], [1, 4], (t) => t));
  const contador = anim(f, [tAguenta - 4, tAguenta + 4], [0, 1]) * (1 - anim(f, [f17.inicio - 6, f17.inicio + 2], [0, 1]));

  const pos = chaves(f, [0, f17.inicio, f17.fim + 10], [
    [2.2, 2.4, 6.4],
    [0.9, 1.85, 3.4],
    [0.05, 1.45, 0.75],
  ]);
  const alvo = chaves(f, [0, f17.inicio, f17.fim + 10], [
    [0, 1.2, -1.2],
    [0, 1.25, -1.2],
    [CABECA_TANAKA[0], CABECA_TANAKA[1] - 0.04, CABECA_TANAKA[2]],
  ]);
  return (
    <AbsoluteFill>
      <Palco>
        <Camera pos={pos} alvo={alvo} fov={34} />
        <Sala horas={9 + f / 30 / 60} mes="ANO 4" vidaPlanta={0}>
          <EstacaoTanaka personagem={{ cabelo: COR.grisalho, expressao: "serio", pose: "sentado", olhar: f >= f17.inicio ? [0, 0] : [-0.6, 0.2] }} />
        </Sala>
      </Palco>
      <Contador rotulo="ANO" valor={anos} visivel={contador} />
      {[0, 30, 60, 90, 120, 150, 180].map((k) => (
        <Som key={k} arquivo="tick.wav" em={f17.inicio + k - 30} volume={0.3} />
      ))}
    </AbsoluteFill>
  );
};
