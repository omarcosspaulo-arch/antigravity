import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, chaves } from "../anim";
import { Clarao, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { Corredor, Z_PORTA } from "../mundo/Corredor";
import { Sala } from "../mundo/Sala";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f06 — "Ele abre a porta... e encontra uma sala vazia."
// Parte 1: corredor e porta abrindo. Parte 2 (a partir de "encontra"): a sala vazia.
export const CenaPorta: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const D = cena.duracao;
  const tPorta = quando(cena, "porta", 1, 20);
  const tEncontra = quando(cena, "encontra", 1, Math.round(D * 0.55));
  const corte = tEncontra - 3;

  if (f >= corte) {
    const pos = chaves(f, [corte, D], [[0.3, 2.3, 7.2], [0.2, 2.0, 5.6]]);
    return (
      <AbsoluteFill>
        <Palco>
          <Camera pos={pos} alvo={[0, 1.2, -1.4]} fov={36} />
          <Sala horas={9.9} />
        </Palco>
        <Clarao em={corte} dur={14} />
      </AbsoluteFill>
    );
  }

  const abertura = anim(f, [tPorta - 2, tPorta + 14], [0, 1]);
  const pos = chaves(f, [0, tPorta, corte], [[0.15, 1.65, Z_PORTA + 7.5], [0, 1.6, Z_PORTA + 3.0], [0, 1.5, Z_PORTA + 0.9]]);
  const brilho = anim(f, [tPorta, corte], [0, 1]);
  return (
    <AbsoluteFill>
      <Palco fundo="#dfe6ee" luz={{ alcanceSombra: 10, posicao: [2, 9, -2], ambiente: 0.8, intensidade: 1.4, cor: "#e8f0ff" }}>
        <Camera pos={pos} alvo={[0, 1.4, Z_PORTA - 1]} fov={38} />
        <Corredor abertura={abertura} brilho={brilho} />
      </Palco>
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: anim(f, [corte - 8, corte], [0, 0.9]) }} />
      <Som arquivo="whoosh.wav" em={tPorta - 2} volume={0.45} />
      <Som arquivo="vento.wav" em={corte} volume={0.35} />
    </AbsoluteFill>
  );
};
