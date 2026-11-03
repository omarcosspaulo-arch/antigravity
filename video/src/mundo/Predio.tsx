import React from "react";
import { COR } from "../paleta";
import { Caixa } from "./base";
import { Personagem, Pose, TANAKA } from "./Personagem";

// Prédio em corte: dezenas de salinhas iguais, cada uma com UMA pessoa sem nada pra fazer.

export const CELA = { w: 2.6, h: 2.3, d: 2.0 };
export const COLUNAS = 5;
export const ANDARES = 7;
/** a cela do Tanaka (centro) */
export const CELA_TANAKA = { col: 2, andar: 3 };

const CORES_PAREDE = ["#f6ecd9", "#e3f1ea", "#f9e3d6", "#e6e9f6", "#f3efd2"];
const POSES: Pose[] = ["sentado", "queixo", "cabecaBaixa", "jornal", "sentado", "queixo"];
const TERNOS = ["#2f3f73", "#5a5f6e", "#3b3446", "#2f5c73", "#4a3f73"];

export const centroCela = (col: number, andar: number): [number, number, number] => [
  (col - (COLUNAS - 1) / 2) * CELA.w,
  andar * CELA.h,
  0,
];

export const Predio: React.FC<{ todosCabisbaixos?: number; luzApagada?: (col: number, andar: number) => number }> = ({
  todosCabisbaixos = 0,
  luzApagada,
}) => {
  const larguraTotal = COLUNAS * CELA.w;
  const alturaTotal = ANDARES * CELA.h;
  const celas: React.ReactNode[] = [];
  for (let andar = 0; andar < ANDARES; andar++) {
    for (let col = 0; col < COLUNAS; col++) {
      const [x, y] = centroCela(col, andar);
      const i = andar * COLUNAS + col;
      const ehTanaka = col === CELA_TANAKA.col && andar === CELA_TANAKA.andar;
      const apagada = luzApagada?.(col, andar) ?? 0;
      const corParede = CORES_PAREDE[(i * 3) % CORES_PAREDE.length];
      const pose: Pose = todosCabisbaixos > i / (COLUNAS * ANDARES) ? "cabecaBaixa" : POSES[i % POSES.length];
      celas.push(
        <group key={i} position={[x, y, 0]}>
          {/* piso e parede */}
          <Caixa tam={[CELA.w - 0.12, 0.08, CELA.d]} pos={[0, 0.04, 0]} cor={COR.piso} raio={0} sombra={false} />
          <Caixa tam={[CELA.w - 0.12, CELA.h - 0.2, 0.08]} pos={[0, CELA.h / 2, -CELA.d / 2]} cor={apagada > 0.5 ? "#59627a" : corParede} raio={0} sombra={false} />
          {/* luminária */}
          <Caixa tam={[0.7, 0.04, 0.2]} pos={[0, CELA.h - 0.25, -0.3]} cor="#ffffff" emissiva="#fffbe8" intensidadeEmissiva={apagada > 0.5 ? 0 : 0.7} sombra={false} />
          {/* mesa */}
          <Caixa tam={[1.1, 0.06, 0.55]} pos={[0, 0.66, 0.15]} cor={COR.mesa} raio={0.02} sombra={false} />
          <Caixa tam={[1.04, 0.4, 0.03]} pos={[0, 0.42, 0.41]} cor={COR.mesaLateral} raio={0.01} sombra={false} />
          <Personagem
            {...(ehTanaka ? TANAKA : { oculos: i % 4 === 1, tipoCabelo: i % 3 === 0 ? "careca" : "lateral", terno: TERNOS[i % TERNOS.length], cabelo: i % 5 === 2 ? COR.grisalho : COR.cabeloPreto })}
            pos={[0, 0.55, -0.2]}
            escala={0.66}
            pose={ehTanaka ? "sentado" : pose}
            expressao={pose === "cabecaBaixa" ? "triste" : "tedio"}
            semente={i}
            sombra={false}
          />
        </group>,
      );
    }
  }
  return (
    <group>
      {/* estrutura de concreto */}
      {Array.from({ length: ANDARES + 1 }).map((_, a) => (
        <Caixa key={`laje${a}`} tam={[larguraTotal + 0.4, 0.16, CELA.d + 0.3]} pos={[0, a * CELA.h - 0.04, 0.05]} cor="#c9c3bb" raio={0.02} sombra={false} />
      ))}
      {Array.from({ length: COLUNAS + 1 }).map((_, c) => (
        <Caixa key={`pilar${c}`} tam={[0.14, alturaTotal, CELA.d + 0.3]} pos={[(c - COLUNAS / 2) * CELA.w, alturaTotal / 2, 0.05]} cor="#d8d2ca" raio={0.02} sombra={false} />
      ))}
      {/* telhado com letreiro */}
      <Caixa tam={[larguraTotal + 0.6, 0.5, CELA.d + 0.5]} pos={[0, alturaTotal + 0.2, 0]} cor="#8d8579" raio={0.04} sombra={false} />
      <Caixa tam={[3.6, 0.9, 0.12]} pos={[0, alturaTotal + 0.95, 0.4]} cor={COR.vermelhoJP} raio={0.06} sombra={false} />
      {/* térreo / chão */}
      <Caixa tam={[60, 0.2, 40]} pos={[0, -0.25, 0]} cor="#4b5a78" raio={0} sombra={false} />
      {celas}
    </group>
  );
};
