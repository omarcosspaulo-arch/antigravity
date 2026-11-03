import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, chaves, pop } from "../anim";
import { IconeRiscado, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { Balao, Cadeira, Feno, Mesa } from "../mundo/objetos";
import { Personagem, TANAKA } from "../mundo/Personagem";
import { CABECA_TANAKA, ESCALA_TANAKA, POS_TANAKA, Sala } from "../mundo/Sala";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f07 — "Uma mesa. Uma cadeira. Nenhum computador. Nenhum telefone."
// f08 — "Ele pergunta o que tem que fazer. A resposta: nada."
export const CenaInventario: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const [, f08] = cena.falas;
  const tMesa = quando(cena, "mesa") - 2;
  const tCadeira = quando(cena, "cadeira") - 2;
  const tPc = quando(cena, "computador") - 4;
  const tTel = quando(cena, "telefone") - 4;
  const tPergunta = quando(cena, "pergunta");
  const tResposta = quando(cena, "resposta");
  const tNada = quando(cena, "nada");

  const escMesa = pop(f, tMesa, 10);
  const escCadeira = pop(f, tCadeira, 10);
  const entraTanaka = anim(f, [f08.inicio - 8, f08.inicio + 4], [0, 1]);
  const balao = pop(f, tPergunta, 8) * (1 - anim(f, [tResposta, tResposta + 6], [0, 1]));
  const feno = anim(f, [tNada - 6, tNada + 60], [-4.2, 3.8], (t) => t);
  const iconesSaem = anim(f, [f08.inicio - 6, f08.inicio + 4], [1, 0]);

  const pos = chaves(f, [0, cena.duracao], [[0.7, 1.95, 5.0], [0.4, 1.75, 4.0]]);
  const expressao = f >= tNada ? "triste" : f >= tResposta ? "feliz" : "neutro";

  return (
    <AbsoluteFill>
      <Palco>
        <Camera pos={pos} alvo={[0, 1.05, -1.2]} fov={34} />
        <Sala horas={10 + f / 30 / 60}>
          {escCadeira > 0.01 ? <Cadeira pos={[0, 0, -1.55]} escala={escCadeira} /> : null}
          {entraTanaka > 0.01 ? (
            <Personagem
              {...TANAKA}
              pos={[POS_TANAKA[0] - (1 - entraTanaka) * 2.5, POS_TANAKA[1] + Math.sin(entraTanaka * Math.PI) * 0.15, POS_TANAKA[2]]}
              escala={ESCALA_TANAKA}
              expressao={expressao}
              olhar={f >= tPergunta && f < tNada ? [0.5, 0.6] : [0, 0]}
            />
          ) : null}
          {escMesa > 0.01 ? (
            <group position={[0, 0, -0.75]} scale={escMesa}>
              <Mesa largura={1.6} />
            </group>
          ) : null}
          {balao > 0.01 ? (
            <Balao simbolo="?" pos={[CABECA_TANAKA[0] + 0.55, CABECA_TANAKA[1] + 0.5, CABECA_TANAKA[2] + 0.1]} escalaPop={balao} />
          ) : null}
          {f >= tNada - 6 ? <Feno pos={[feno, 0.3 + Math.abs(Math.sin(feno * 2.2)) * 0.25, 0.4]} giro={-feno / 0.28} /> : null}
        </Sala>
      </Palco>
      <div style={{ opacity: iconesSaem }}>
        <IconeRiscado tipo="computador" em={tPc} x={290} y={600} />
        <IconeRiscado tipo="telefone" em={tTel} x={790} y={600} />
      </div>
      <Som arquivo="pop.wav" em={tMesa} />
      <Som arquivo="pop.wav" em={tCadeira} />
      <Som arquivo="pop.wav" em={tPc} volume={0.45} />
      <Som arquivo="pop.wav" em={tTel} volume={0.45} />
      <Som arquivo="whoosh.wav" em={f08.inicio - 8} volume={0.35} />
      <Som arquivo="pop.wav" em={tPergunta} volume={0.35} />
      <Som arquivo="vento.wav" em={tNada - 4} volume={0.7} />
    </AbsoluteFill>
  );
};
