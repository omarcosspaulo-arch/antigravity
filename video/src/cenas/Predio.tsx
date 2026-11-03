import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, chaves, V3 } from "../anim";
import { EtiquetaJapao, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import { CELA_TANAKA, centroCela, Predio } from "../mundo/Predio";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f12–f13 — a câmera se afasta e revela um prédio inteiro de salinhas iguais.
export const CenaPredio: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const [f12, f13] = cena.falas;
  const tDemitir = quando(cena, "demitir", 1, f12.fim - 20);
  const tDeixam = quando(cena, "deixam", 1, f13.inicio + 40);

  const c = centroCela(CELA_TANAKA.col, CELA_TANAKA.andar);
  const alvoPerto: V3 = [c[0], c[1] + 1.0, c[2]];
  const posPerto: V3 = [c[0] + 0.3, c[1] + 1.3, c[2] + 3.4];
  const alvoLonge: V3 = [0, 8.6, 0];
  const posLonge: V3 = [7.5, 10.5, 37];

  const pos = chaves(f, [0, 10, f13.inicio + 10, cena.duracao], [posPerto, posPerto, [6.5, 9.8, 32], posLonge]);
  const alvo = chaves(f, [0, 10, f13.inicio + 10, cena.duracao], [alvoPerto, alvoPerto, [0, 8.4, 0], alvoLonge]);
  const cabisbaixos = anim(f, [tDeixam, tDeixam + 40], [0, 1], (t) => t);

  return (
    <AbsoluteFill>
      <Palco fundo="#2b3a67" neblina={["#2b3a67", 30, 90]} luz={{ alcanceSombra: 12, intensidade: 1.6, ambiente: 1.0, posicao: [-6, 20, 14] }}>
        <Camera pos={pos} alvo={alvo} fov={34} />
        <Predio todosCabisbaixos={cabisbaixos} />
        {/* estrelas */}
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} position={[((i * 37) % 60) - 30, 14 + ((i * 53) % 20), -25 - (i % 5)]}>
            <circleGeometry args={[0.08 + (i % 3) * 0.03, 8]} />
            <meshBasicMaterial color="#fff6c8" />
          </mesh>
        ))}
      </Palco>
      <EtiquetaJapao em={4} ate={tDemitir + 20} texto="NO JAPÃO" />
      <Som arquivo="whoosh.wav" em={10} volume={0.4} />
      <Som arquivo="carimbo.wav" em={tDemitir} volume={0.5} />
    </AbsoluteFill>
  );
};
