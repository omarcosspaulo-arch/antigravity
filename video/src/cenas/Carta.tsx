import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { chaves, pop } from "../anim";
import { Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { Envelope } from "../mundo/objetos";
import { EstacaoTanaka, Sala } from "../mundo/Sala";
import { COR } from "../paleta";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f14 — "e esperam o tédio te vencer. Até você pedir demissão. Sozinho."
export const CenaCarta: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const tTedio = quando(cena, "tédio", 1, 10);
  const tDemissao = quando(cena, "demissão", 1, 50);
  const tSozinho = quando(cena, "sozinho", 1, 80);
  const envelope = pop(f, tDemissao - 3, 10);

  const pose = f >= tDemissao ? "sentado" : f >= tTedio ? "cabecaBaixa" : "queixo";
  const expressao = f >= tSozinho ? "triste" : f >= tDemissao ? "choque" : "tedio";
  const olhar: [number, number] = f >= tDemissao ? [0.3, -1] : [0, 0];

  const pos = chaves(f, [0, cena.duracao], [[1.5, 1.85, 2.6], [0.9, 1.65, 1.6]]);
  return (
    <AbsoluteFill>
      <Palco luz={{ cor: "#ffc48a", intensidade: 1.7, posicao: [5, 5, 3], ambiente: 0.75 }}>
        <Camera pos={pos} alvo={[0.05, 1.15, -1.1]} fov={34} />
        <Sala horas={16.6} ceu={COR.ceuTarde} vidaPlanta={0.3} mes="NOV">
          <EstacaoTanaka
            personagem={{ pose, expressao, olhar }}
            sobreMesa={envelope > 0.01 ? <Envelope pos={[0.26, 0.98, 0.0]} rot={[-0.28, -0.15, 0.05]} escala={envelope * 0.78} /> : null}
          />
        </Sala>
      </Palco>
      <Som arquivo="carimbo.wav" em={tDemissao - 3} volume={0.6} />
    </AbsoluteFill>
  );
};
