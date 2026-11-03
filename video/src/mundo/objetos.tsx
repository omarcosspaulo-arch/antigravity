import React from "react";
import * as THREE from "three";
import type { V3 } from "../anim";
import { FONTE, PILHA_JP } from "../fontes";
import { COR } from "../paleta";
import { Caixa, Cilindro, Disco, Esfera, PlanoTextura, Ret, useTexturaCanvas } from "./base";

type Base = { pos?: V3; rot?: V3; escala?: number | V3 };

export const Mesa: React.FC<Base & { largura?: number; cor?: string; painel?: string }> = ({
  pos,
  rot,
  escala,
  largura = 1.6,
  cor = COR.mesa,
  painel = COR.mesaLateral,
}) => (
  <group position={pos} rotation={rot} scale={escala}>
    <Caixa tam={[largura, 0.07, 0.8]} pos={[0, 0.78, 0]} cor={cor} raio={0.03} />
    <Caixa tam={[largura - 0.08, 0.5, 0.04]} pos={[0, 0.5, 0.34]} cor={painel} raio={0.015} />
    {[-1, 1].map((l) => (
      <Caixa key={l} tam={[0.05, 0.76, 0.7]} pos={[(largura / 2 - 0.06) * l, 0.38, 0]} cor={painel} raio={0.015} />
    ))}
  </group>
);

export const Cadeira: React.FC<Base & { cor?: string }> = ({ pos, rot, escala, cor = COR.cadeira }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <Caixa tam={[0.62, 0.08, 0.56]} pos={[0, 0.48, 0]} cor={cor} raio={0.035} />
    <Caixa tam={[0.6, 0.72, 0.08]} pos={[0, 0.92, -0.26]} cor={cor} raio={0.06} />
    <Cilindro r={0.035} h={0.4} pos={[0, 0.26, 0]} cor={COR.metal} />
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return <Caixa key={i} tam={[0.05, 0.04, 0.32]} pos={[Math.sin(a) * 0.14, 0.04, Math.cos(a) * 0.14]} rot={[0, a, 0]} cor={COR.metal} />;
    })}
  </group>
);

export const Monitor: React.FC<Base & { tela?: string; ligado?: boolean }> = ({ pos, rot, escala, tela = COR.tela, ligado = true }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <Caixa tam={[0.56, 0.38, 0.04]} pos={[0, 0.3, 0]} cor="#2b2d3a" raio={0.02} />
    <mesh position={[0, 0.3, 0.021]}>
      <planeGeometry args={[0.5, 0.32]} />
      <meshBasicMaterial color={ligado ? tela : "#1c1e27"} />
    </mesh>
    {ligado
      ? [0.08, 0.03, -0.02, -0.07].map((y, i) => (
          <Ret key={i} w={0.14 + ((i * 37) % 5) * 0.05} h={0.022} r={0.01} pos={[-0.16 + (0.14 + ((i * 37) % 5) * 0.05) / 2, 0.3 + y, 0.023]} cor="#ffffff" opacidade={0.75} sombra={false} />
        ))
      : null}
    <Caixa tam={[0.06, 0.12, 0.06]} pos={[0, 0.07, -0.02]} cor="#2b2d3a" />
    <Caixa tam={[0.22, 0.02, 0.16]} pos={[0, 0.01, -0.02]} cor="#2b2d3a" />
  </group>
);

/** Relógio de parede. `horas` contínuo (ex.: 9.5 = 9h30). */
export const Relogio: React.FC<Base & { horas: number; raio?: number }> = ({ pos, rot, escala, horas, raio = 0.32 }) => {
  const aH = -((horas % 12) / 12) * Math.PI * 2;
  const aM = -(horas % 1) * Math.PI * 2;
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <Cilindro r={raio} h={0.06} rot={[Math.PI / 2, 0, 0]} cor="#ffffff" lados={48} />
      <mesh position={[0, 0, 0.0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[raio, 0.035, 12, 48]} />
        <meshToonMaterial color={COR.vermelhoJP} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Ret key={i} w={0.018} h={i % 3 === 0 ? 0.07 : 0.04} pos={[Math.sin(a) * raio * 0.8, Math.cos(a) * raio * 0.8, 0.032]} rot={-a} cor={COR.tracos} sombra={false} />;
      })}
      <group position={[0, 0, 0.036]} rotation={[0, 0, aH]}>
        <Ret w={0.032} h={raio * 0.55} r={0.014} pos={[0, raio * 0.22, 0]} cor={COR.tracos} sombra={false} />
      </group>
      <group position={[0, 0, 0.038]} rotation={[0, 0, aM]}>
        <Ret w={0.022} h={raio * 0.8} r={0.01} pos={[0, raio * 0.33, 0]} cor={COR.tracos} sombra={false} />
      </group>
      <Disco r={0.025} pos={[0, 0, 0.04]} cor={COR.vermelhoJP} sombra={false} />
    </group>
  );
};

/** Janela "pintada" na parede, com céu e silhueta da cidade. */
export const Janela: React.FC<Base & { ceu: string; cidade?: string; largura?: number; altura?: number; luzes?: number }> = ({
  pos,
  rot,
  escala,
  ceu,
  cidade = "#6d8fb3",
  largura = 1.3,
  altura = 1.2,
  luzes = 0,
}) => {
  const predios = [
    [-0.45, 0.42, 0.22],
    [-0.22, 0.62, 0.2],
    [0.0, 0.35, 0.18],
    [0.2, 0.75, 0.22],
    [0.43, 0.5, 0.2],
  ];
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[largura, altura]} />
        <meshBasicMaterial color={ceu} />
      </mesh>
      {predios.map(([x, h, w], i) => (
        <group key={i}>
          <Ret w={w * largura} h={h * altura} pos={[x * largura, -altura / 2 + (h * altura) / 2, 0.003]} cor={cidade} sombra={false} />
          {luzes > 0
            ? [0.15, 0.3, 0.45].map((yy, j) =>
                yy < h - 0.08 ? (
                  <Ret key={j} w={0.035} h={0.04} pos={[x * largura + (j % 2 ? 0.03 : -0.03), -altura / 2 + yy * altura, 0.005]} cor="#ffe28a" opacidade={luzes} sombra={false} />
                ) : null,
              )
            : null}
        </group>
      ))}
      {/* moldura */}
      <Caixa tam={[largura + 0.12, 0.08, 0.1]} pos={[0, altura / 2 + 0.02, 0.03]} cor="#ffffff" />
      <Caixa tam={[largura + 0.2, 0.08, 0.2]} pos={[0, -altura / 2 - 0.02, 0.06]} cor="#ffffff" />
      <Caixa tam={[0.08, altura + 0.1, 0.1]} pos={[-largura / 2 - 0.02, 0, 0.03]} cor="#ffffff" />
      <Caixa tam={[0.08, altura + 0.1, 0.1]} pos={[largura / 2 + 0.02, 0, 0.03]} cor="#ffffff" />
      <Caixa tam={[0.05, altura, 0.06]} pos={[0, 0, 0.02]} cor="#ffffff" sombra={false} />
    </group>
  );
};

/** Planta no vaso. `vida` 1 = verde e viçosa, 0 = seca e murcha. */
export const Planta: React.FC<Base & { vida?: number }> = ({ pos, rot, escala, vida = 1 }) => {
  const verde = new THREE.Color("#4caf6a").lerp(new THREE.Color("#a8875a"), 1 - vida).getStyle();
  const caida = (1 - vida) * 0.9;
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <Cilindro r={0.17} rTopo={0.22} h={0.4} pos={[0, 0.2, 0]} cor="#d8784f" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[0, 0.42, 0]} rotation={[Math.cos(a) * (0.35 + caida), a, Math.sin(a) * (0.35 + caida)]}>
            <Esfera r={0.14} pos={[0, 0.28 * (1 - caida * 0.4), 0]} escala={[0.6, 1.5 * (0.7 + vida * 0.3), 0.35]} cor={verde} detalhe={0} />
          </group>
        );
      })}
    </group>
  );
};

/** Calendário de parede com o mês escrito. */
export const Calendario: React.FC<Base & { texto: string; sub?: string }> = ({ pos, rot, escala, texto, sub = "" }) => {
  const tex = useTexturaCanvas(
    256,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = COR.vermelhoJP;
      ctx.fillRect(0, 0, w, 84);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 56px ${FONTE}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(texto, w / 2, 46);
      ctx.fillStyle = "#c9c4bb";
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 7; c++) ctx.fillRect(18 + c * 32, 112 + r * 40, 22, 22);
      if (sub) {
        ctx.fillStyle = COR.tracos;
        ctx.font = `900 64px ${FONTE}, sans-serif`;
        ctx.fillText(sub, w / 2, 220);
      }
    },
    `cal-${texto}-${sub}`,
    [`900 56px ${FONTE}`],
  );
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <Caixa tam={[0.5, 0.62, 0.02]} pos={[0, 0, -0.012]} cor="#e8e1d4" raio={0.005} />
      <PlanoTextura textura={tex} w={0.46} h={0.575} pos={[0, 0, 0.001]} />
    </group>
  );
};

/** Bola de feno rolando (o momento "nada"). */
export const Feno: React.FC<Base & { r?: number; giro?: number }> = ({ pos, escala, r = 0.28, giro = 0 }) => (
  <group position={pos} scale={escala} rotation={[0, 0, giro]}>
    <mesh castShadow>
      <icosahedronGeometry args={[r, 1]} />
      <meshBasicMaterial color="#b98a4e" wireframe />
    </mesh>
    <mesh castShadow rotation={[0.6, 0.3, 0.2]}>
      <icosahedronGeometry args={[r * 0.8, 1]} />
      <meshBasicMaterial color="#8f6534" wireframe />
    </mesh>
    <mesh rotation={[0.2, 1.1, 0.5]}>
      <dodecahedronGeometry args={[r * 0.55, 0]} />
      <meshBasicMaterial color="#c99b5c" wireframe />
    </mesh>
  </group>
);

/** Balão de pensamento com um símbolo ("?", "!", "..."). */
export const Balao: React.FC<Base & { simbolo: string; escalaPop?: number }> = ({ pos, simbolo, escalaPop = 1 }) => {
  const tex = useTexturaCanvas(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = COR.tracos;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2 - 10, 108, 96, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COR.tracos;
      ctx.font = `900 150px ${FONTE}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(simbolo, w / 2, h / 2 - 2);
    },
    `balao-${simbolo}`,
    [`900 150px ${FONTE}`],
  );
  return (
    <group position={pos} scale={escalaPop}>
      <PlanoTextura textura={tex} w={0.55} h={0.55} transparente />
      <Disco r={0.05} pos={[-0.2, -0.33, 0]} cor="#ffffff" sombra={false} />
      <Disco r={0.03} pos={[-0.28, -0.42, 0]} cor="#ffffff" sombra={false} />
    </group>
  );
};

/** Jornal segurado na frente do peito (item do personagem). */
export const Jornal: React.FC = () => {
  const tex = useTexturaCanvas(
    320,
    230,
    (ctx, w, h) => {
      ctx.fillStyle = "#efe9dc";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = COR.tracos;
      ctx.font = `900 40px ${FONTE}, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NOTÍCIAS", w / 2, 46);
      ctx.fillRect(14, 58, w - 28, 4);
      ctx.fillStyle = "#8c877d";
      for (let c = 0; c < 3; c++)
        for (let l = 0; l < 9; l++) ctx.fillRect(16 + c * 100, 76 + l * 16, 86 - ((l * 13 + c * 7) % 3) * 12, 7);
    },
    "jornal",
    [`900 40px ${FONTE}`],
  );
  return <PlanoTextura textura={tex} w={0.66} h={0.47} pos={[0, 0.46, 0.012]} />;
};

/** Envelope de pedido de demissão (辞表). */
export const Envelope: React.FC<Base> = ({ pos, rot, escala }) => {
  const tex = useTexturaCanvas(
    200,
    360,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d8d2c6";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = COR.tracos;
      ctx.font = `900 92px ${PILHA_JP}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("辞", w / 2, h / 2 - 58);
      ctx.fillText("表", w / 2, h / 2 + 52);
    },
    "envelope",
    [`900 92px ${PILHA_JP.split(",")[0]}`],
  );
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <Caixa tam={[0.24, 0.42, 0.012]} cor="#ffffff" raio={0.004} />
      <PlanoTextura textura={tex} w={0.23} h={0.41} pos={[0, 0, 0.007]} />
    </group>
  );
};

/** Piso de madeira com tábuas desenhadas. */
export const PisoMadeira: React.FC<Base & { largura: number; profundidade: number; cor?: string; escura?: string }> = ({
  pos,
  largura,
  profundidade,
  cor = COR.piso,
  escura = COR.pisoEscuro,
}) => {
  const tex = useTexturaCanvas(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = cor;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = escura;
      const n = 8;
      for (let i = 0; i < n; i++) {
        ctx.fillRect(0, (i * h) / n, w, 4);
        const off = (i % 2) * 0.5 + 0.25;
        ctx.fillRect(((off * w) % w) | 0, (i * h) / n, 4, h / n);
      }
    },
    `piso-${cor}`,
  );
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(largura / 3, profundidade / 3);
  return (
    <group position={pos}>
      <Caixa tam={[largura, 0.2, profundidade]} pos={[0, -0.1, 0]} cor={escura} raio={0.02} sombra={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[largura, profundidade]} />
        <meshToonMaterial map={tex} />
      </mesh>
    </group>
  );
};
