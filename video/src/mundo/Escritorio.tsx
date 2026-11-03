import React from "react";
import type { V3 } from "../anim";
import { COR } from "../paleta";
import { Caixa, Cilindro } from "./base";
import { Cadeira, Janela, Mesa, Monitor, Planta } from "./objetos";
import { COLEGAS, Personagem, PropsPersonagem, TANAKA } from "./Personagem";

// Escritório cheio e colorido (o "antes"). Tanaka fica na fileira da frente, no centro.

export const MESA_TANAKA_Z = 1.0;
export const CABECA_TANAKA_ESCRITORIO: V3 = [0, 0.655 + 0.9 * 0.82, MESA_TANAKA_Z - 0.45];

const Caneca: React.FC<{ pos: V3; cor: string }> = ({ pos, cor }) => (
  <group position={pos}>
    <Cilindro r={0.05} h={0.11} pos={[0, 0.055, 0]} cor={cor} />
  </group>
);

const Papeis: React.FC<{ pos: V3; altura: number }> = ({ pos, altura }) => (
  <group position={pos}>
    {Array.from({ length: altura }).map((_, i) => (
      <Caixa key={i} tam={[0.3, 0.025, 0.22]} pos={[(i % 2) * 0.015, 0.0125 + i * 0.026, 0]} rot={[0, (i % 3) * 0.06, 0]} cor={i % 4 === 3 ? "#ffe08a" : "#ffffff"} raio={0.005} />
    ))}
  </group>
);

export const Estacao: React.FC<{
  pos: V3;
  personagem: Partial<PropsPersonagem>;
  semente: number;
  lado?: -1 | 1;
}> = ({ pos, personagem, semente, lado = -1 }) => (
  <group position={pos}>
    <Cadeira pos={[0, 0, -0.8]} cor={["#3d4f7c", "#c2507a", "#2aa39b", "#f08a4b"][semente % 4]} />
    <Personagem pos={[0, 0.655, -0.45]} escala={0.82} semente={semente} pose="digitando" {...personagem} />
    <Mesa largura={1.5} />
    <Monitor pos={[0.6 * lado, 0.815, -0.05]} rot={[0, lado < 0 ? 0.55 : -0.55, 0]} tela={["#6fd3ff", "#9cf0b5", "#ffd38a", "#c9b6ff"][semente % 4]} />
    <Papeis pos={[-0.45 * lado, 0.815, 0.1]} altura={2 + (semente % 4)} />
    <Caneca pos={[-0.2 * lado, 0.815, 0.22]} cor={["#ffffff", "#e0393e", "#ffd60a", "#4c9a7a"][semente % 4]} />
  </group>
);

export const Escritorio: React.FC<{
  tanaka?: Partial<PropsPersonagem>;
  olharColegas?: (i: number) => [number, number] | undefined;
  expressaoColegas?: PropsPersonagem["expressao"];
  children?: React.ReactNode;
}> = ({ tanaka = {}, olharColegas, expressaoColegas, children }) => {
  const xs = [-2.2, 0, 2.2];
  const zs = [-2.3, -0.65, MESA_TANAKA_Z];
  let k = 0;
  return (
    <group>
      {/* piso e paredes */}
      <Caixa tam={[11, 0.2, 10]} pos={[0, -0.1, -0.5]} cor={COR.carpete} raio={0.02} />
      <Caixa tam={[11.2, 4, 0.2]} pos={[0, 2, -4.1]} cor={COR.paredeEscritorio} raio={0.02} />
      <Caixa tam={[0.2, 4, 10]} pos={[-5.5, 2, -0.5]} cor="#ff9f7a" raio={0.02} />
      {[-3.4, 0, 3.4].map((x) => (
        <Janela key={x} pos={[x, 2.3, -3.98]} ceu={COR.ceuDia} largura={2.4} altura={1.7} cidade="#7aa4cf" />
      ))}
      {/* luminárias */}
      {[-2.2, 0, 2.2].map((x) =>
        [-2, 0.5].map((z) => (
          <Caixa key={`${x}${z}`} tam={[1.2, 0.05, 0.3]} pos={[x, 3.6, z]} cor="#ffffff" emissiva="#fffbe8" intensidadeEmissiva={0.6} sombra={false} />
        )),
      )}
      <Planta pos={[-4.6, 0, -3.3]} escala={1.5} />
      <Planta pos={[4.6, 0, -3.3]} escala={1.3} />
      <Planta pos={[-4.6, 0, 1.6]} escala={1.2} />
      {/* bebedouro */}
      <group position={[4.4, 0, -1.2]}>
        <Caixa tam={[0.5, 1.0, 0.45]} pos={[0, 0.5, 0]} cor="#e8eef5" raio={0.05} />
        <Cilindro r={0.2} h={0.5} pos={[0, 1.25, 0]} cor="#8fd3ff" />
      </group>

      {zs.map((z, zi) =>
        xs.map((x) => {
          const ehTanaka = zi === 2 && x === 0;
          if (ehTanaka) {
            return (
              <Estacao key="tanaka" pos={[x, 0, z]} semente={99} personagem={{ ...TANAKA, ...tanaka }} lado={-1} />
            );
          }
          const i = k++;
          const olhar = olharColegas?.(i);
          return (
            <Estacao
              key={`${x}${z}`}
              pos={[x, 0, z]}
              semente={i}
              lado={x < 0 ? -1 : 1}
              personagem={{
                ...COLEGAS[i % COLEGAS.length],
                ...(olhar ? { olhar, pose: "sentado" as const } : {}),
                ...(expressaoColegas ? { expressao: expressaoColegas } : {}),
              }}
            />
          );
        }),
      )}
      {children}
    </group>
  );
};
