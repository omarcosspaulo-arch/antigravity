import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, chaves, tremor } from "../anim";
import { CartaoDepartamento, Confete, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { Escritorio, MESA_TANAKA_Z } from "../mundo/Escritorio";
import { CHEFE, Personagem } from "../mundo/Personagem";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f03–f05 — o chefe anuncia a "transferência" e Tanaka acha que é promoção.
const X_COLEGAS = [-2.2, 0, 2.2, -2.2, 0, 2.2, -2.2, 2.2];

export const CenaChefe: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const [f03, f04, f05] = cena.falas;
  const tVoce = quando(cena, "você", 1, f03.inicio + 30);
  const tTransf = quando(cena, "transferido");
  const tPromo = quando(cena, "promoção");

  const chocado = f >= tTransf && f < f04.inicio + 10;
  const feliz = f >= tPromo - 4;
  const expressao = feliz ? "feliz" : chocado ? "choque" : f >= f04.inicio ? "neutro" : "neutro";
  const pose = feliz ? "comemorando" : "sentado";

  const soco = anim(f, [tTransf - 2, tTransf + 5], [0, 1]) * (1 - anim(f, [f04.inicio - 4, f04.inicio + 8], [0, 1]));
  const base = chaves(f, [0, f04.inicio, f05.inicio, cena.duracao], [
    [1.1, 2.0, 6.0],
    [0.9, 1.95, 5.5],
    [0.8, 1.9, 5.4],
    [0.6, 1.85, 5.0],
  ]);
  const t = f >= tTransf && f < tTransf + 8 ? tremor(f, 0.06) : [0, 0, 0];
  const pos: [number, number, number] = [base[0] - soco * 0.5 + t[0], base[1] - soco * 0.2 + t[1], base[2] - soco * 1.6];
  const alvo: [number, number, number] = [0.42 - soco * 0.42, 1.35 + soco * 0.02, MESA_TANAKA_Z - 0.4];

  const chefeFalando = f >= tVoce && f < f03.fim;
  const olharColegas = f >= tTransf ? (i: number) => [X_COLEGAS[i] < 0 ? 1 : X_COLEGAS[i] > 0 ? -1 : 0, -0.4] as [number, number] : undefined;

  return (
    <AbsoluteFill>
      <Palco fundo="#ffd98a" luz={{ alcanceSombra: 9, posicao: [-5, 10, 7] }}>
        <Camera pos={pos} alvo={alvo} fov={34} />
        <Escritorio
          tanaka={{ expressao, pose, olhar: f < f05.inicio ? [0.8, 0.1] : [0, 0] }}
          olharColegas={olharColegas}
        >
          <Personagem
            {...CHEFE}
            pos={[0.86, 0.76, MESA_TANAKA_Z - 0.62]}
            escala={0.86}
            pose={f >= tTransf - 6 && f < f05.inicio ? "apontando" : "empe"}
            expressao={f >= f05.inicio ? "serio" : "bravo"}
            falando={chefeFalando}
            olhar={[-0.9, 0]}
            semente={5}
          />
        </Escritorio>
      </Palco>
      <CartaoDepartamento em={f04.inicio} ate={f05.inicio - 4} />
      <Confete em={tPromo} />
      <Som arquivo="pop.wav" em={f04.inicio} volume={0.5} />
      <Som arquivo="boom.wav" em={tTransf} volume={0.35} duracao={30} />
      <Som arquivo="ding.wav" em={tPromo} volume={0.45} />
    </AbsoluteFill>
  );
};
