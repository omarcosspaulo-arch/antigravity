import React from "react";
import { FONTE, PILHA_JP } from "../fontes";
import { Caixa, Cilindro, PlanoTextura, useTexturaCanvas } from "./base";

// Corredor frio e comprido que termina na porta do "Departamento de
// Desenvolvimento de Carreira". A porta fica em z = -9.

export const Z_PORTA = -9;

const Placa: React.FC = () => {
  const tex = useTexturaCanvas(
    640,
    300,
    (ctx, w, h) => {
      ctx.fillStyle = "#1f2a44";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#f2c14e";
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = `900 54px ${PILHA_JP}`;
      ctx.fillText("キャリア開発室", w / 2, 96);
      ctx.fillStyle = "#f2c14e";
      ctx.font = `900 40px ${FONTE}, sans-serif`;
      ctx.fillText("DEPARTAMENTO DE", w / 2, 170);
      ctx.fillText("DESENV. DE CARREIRA", w / 2, 222);
    },
    "placa",
    [`900 54px ${PILHA_JP.split(",")[0]}`, `900 40px ${FONTE}`],
  );
  return (
    <group position={[0, 2.62, Z_PORTA + 0.12]}>
      <Caixa tam={[1.36, 0.66, 0.04]} cor="#1f2a44" raio={0.02} />
      <PlanoTextura textura={tex} w={1.3} h={0.61} pos={[0, 0, 0.022]} />
    </group>
  );
};

/** `abertura` 0 = fechada, 1 = escancarada */
export const Corredor: React.FC<{ abertura: number; brilho: number }> = ({ abertura, brilho }) => {
  const portas = [-1, -3.5, -6];
  return (
    <group>
      {/* piso, paredes, teto */}
      <Caixa tam={[3.2, 0.2, 16]} pos={[0, -0.1, -2]} cor="#a9b8c9" raio={0.02} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Caixa key={i} tam={[3.0, 0.005, 0.05]} pos={[0, 0.003, 4 - i * 1.6]} cor="#93a3b6" sombra={false} />
      ))}
      <Caixa tam={[0.2, 3.4, 16]} pos={[-1.6, 1.7, -2]} cor="#dfe6ee" raio={0.02} />
      <Caixa tam={[0.2, 3.4, 16]} pos={[1.6, 1.7, -2]} cor="#d3dce7" raio={0.02} />
      <Caixa tam={[3.4, 0.2, 16]} pos={[0, 3.5, -2]} cor="#eef2f6" raio={0.02} sombra={false} />
      {[1, -2.5, -6].map((z) => (
        <Caixa key={z} tam={[0.5, 0.04, 1.2]} pos={[0, 3.38, z]} cor="#ffffff" emissiva="#ffffff" intensidadeEmissiva={0.8} sombra={false} />
      ))}
      {/* portas laterais fechadas */}
      {portas.map((z) => (
        <group key={z}>
          <Caixa tam={[0.06, 2.1, 0.9]} pos={[-1.49, 1.05, z]} cor="#8e9bb0" raio={0.02} />
          <Caixa tam={[0.06, 2.1, 0.9]} pos={[1.49, 1.05, z - 1.2]} cor="#8e9bb0" raio={0.02} />
        </group>
      ))}

      {/* parede do fundo com vão da porta */}
      <Caixa tam={[1.1, 3.4, 0.2]} pos={[-1.05, 1.7, Z_PORTA]} cor="#dfe6ee" />
      <Caixa tam={[1.1, 3.4, 0.2]} pos={[1.05, 1.7, Z_PORTA]} cor="#dfe6ee" />
      <Caixa tam={[1.0, 1.2, 0.2]} pos={[0, 2.8, Z_PORTA]} cor="#dfe6ee" />
      <Placa />

      {/* luz branca do outro lado */}
      <mesh position={[0, 1.1, Z_PORTA - 0.4]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshBasicMaterial color={`hsl(48, 100%, ${88 + brilho * 12}%)`} />
      </mesh>

      {/* porta (dobradiça na esquerda) */}
      <group position={[-0.48, 0, Z_PORTA + 0.02]} rotation={[0, abertura * 1.75, 0]}>
        <Caixa tam={[0.96, 2.2, 0.06]} pos={[0.48, 1.1, 0]} cor="#c98d5a" raio={0.02} />
        <Caixa tam={[0.7, 0.75, 0.02]} pos={[0.48, 1.55, 0.035]} cor="#b97d4c" raio={0.01} sombra={false} />
        <Caixa tam={[0.7, 0.6, 0.02]} pos={[0.48, 0.55, 0.035]} cor="#b97d4c" raio={0.01} sombra={false} />
        <Cilindro r={0.045} h={0.1} pos={[0.85, 1.05, 0.06]} rot={[Math.PI / 2, 0, 0]} cor="#f2c14e" />
      </group>
    </group>
  );
};
