import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { V3 } from "../anim";

// ---------------------------------------------------------------------------
// Palco: o canvas 3D com a iluminação padrão do "diorama"
// ---------------------------------------------------------------------------

export type Luz = {
  cor?: string;
  intensidade?: number;
  posicao?: V3;
  ambiente?: number;
  ceu?: string;
  chao?: string;
  hemisferio?: number;
  alcanceSombra?: number;
};

export const Palco: React.FC<{
  children: React.ReactNode;
  fundo?: string;
  luz?: Luz;
  neblina?: [string, number, number];
}> = ({ children, fundo = "#f6ecd9", luz = {}, neblina }) => {
  const { width, height } = useVideoConfig();
  const alcance = luz.alcanceSombra ?? 7;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      flat
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 34, near: 0.1, far: 200, position: [0, 2, 8] }}
      style={{ background: fundo }}
    >
      <color attach="background" args={[fundo]} />
      {neblina ? <fog attach="fog" args={neblina} /> : null}
      <ambientLight intensity={luz.ambiente ?? 0.9} />
      <hemisphereLight args={[luz.ceu ?? "#fff3df", luz.chao ?? "#b49b86", luz.hemisferio ?? 1.1]} />
      <directionalLight
        position={luz.posicao ?? [-4, 9, 6]}
        intensity={luz.intensidade ?? 2.1}
        color={luz.cor ?? "#fff1dc"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-alcance}
        shadow-camera-right={alcance}
        shadow-camera-top={alcance}
        shadow-camera-bottom={-alcance}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      {children}
    </ThreeCanvas>
  );
};

// ---------------------------------------------------------------------------
// Câmera controlada por frame (sempre antes do render do R3F)
// ---------------------------------------------------------------------------

export const Camera: React.FC<{ pos: V3; alvo: V3; fov?: number; inclinacao?: number }> = ({
  pos,
  alvo,
  fov = 34,
  inclinacao = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.up.set(Math.sin(inclinacao), Math.cos(inclinacao), 0);
    camera.lookAt(alvo[0], alvo[1], alvo[2]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  });
  return null;
};

// ---------------------------------------------------------------------------
// Peças 3D (mundo) — material "toon" com sombra
// ---------------------------------------------------------------------------

const cacheCaixa = new Map<string, THREE.BufferGeometry>();
const geoCaixa = (w: number, h: number, d: number, r: number) => {
  const chave = [w, h, d, r].join("|");
  let g = cacheCaixa.get(chave);
  if (!g) {
    g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
    cacheCaixa.set(chave, g);
  }
  return g;
};

type PropsPeca = {
  pos?: V3;
  rot?: V3;
  escala?: number | V3;
  cor: string;
  sombra?: boolean;
  emissiva?: string;
  intensidadeEmissiva?: number;
  opacidade?: number;
  basico?: boolean;
};

export const Caixa: React.FC<PropsPeca & { tam: V3; raio?: number }> = ({
  tam,
  raio = 0.03,
  pos,
  rot,
  escala,
  cor,
  sombra = true,
  emissiva,
  intensidadeEmissiva = 1,
  opacidade = 1,
  basico = false,
}) => {
  const geo = useMemo(() => geoCaixa(tam[0], tam[1], tam[2], raio), [tam, raio]);
  return (
    <mesh geometry={geo} position={pos} rotation={rot} scale={escala} castShadow={sombra} receiveShadow>
      {basico ? (
        <meshBasicMaterial color={cor} transparent={opacidade < 1} opacity={opacidade} />
      ) : (
        <meshToonMaterial
          color={cor}
          emissive={emissiva ?? "#000000"}
          emissiveIntensity={emissiva ? intensidadeEmissiva : 0}
          transparent={opacidade < 1}
          opacity={opacidade}
        />
      )}
    </mesh>
  );
};

export const Cilindro: React.FC<PropsPeca & { r: number; h: number; rTopo?: number; lados?: number }> = ({
  r,
  h,
  rTopo,
  lados = 32,
  pos,
  rot,
  escala,
  cor,
  sombra = true,
  emissiva,
}) => (
  <mesh position={pos} rotation={rot} scale={escala} castShadow={sombra} receiveShadow>
    <cylinderGeometry args={[rTopo ?? r, r, h, lados]} />
    <meshToonMaterial color={cor} emissive={emissiva ?? "#000000"} emissiveIntensity={emissiva ? 1 : 0} />
  </mesh>
);

export const Esfera: React.FC<PropsPeca & { r: number; detalhe?: number; facetada?: boolean }> = ({
  r,
  detalhe = 1,
  facetada = true,
  pos,
  rot,
  escala,
  cor,
  sombra = true,
}) => (
  <mesh position={pos} rotation={rot} scale={escala} castShadow={sombra} receiveShadow>
    {facetada ? <icosahedronGeometry args={[r, detalhe]} /> : <sphereGeometry args={[r, 32, 16]} />}
    <meshLambertMaterial color={cor} flatShading={facetada} />
  </mesh>
);

// ---------------------------------------------------------------------------
// Peças 2D (personagens "recortados") — cor chapada, sem luz
// ---------------------------------------------------------------------------

const cacheForma = new Map<string, THREE.ShapeGeometry>();
export const geoRetArredondado = (w: number, h: number, r: number) => {
  const chave = [w, h, r].join("|");
  let g = cacheForma.get(chave);
  if (!g) {
    const rr = Math.min(r, w / 2, h / 2);
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + rr, y);
    s.lineTo(x + w - rr, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rr);
    s.lineTo(x + w, y + h - rr);
    s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    s.lineTo(x + rr, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rr);
    s.lineTo(x, y + rr);
    s.quadraticCurveTo(x, y, x + rr, y);
    g = new THREE.ShapeGeometry(s, 8);
    cacheForma.set(chave, g);
  }
  return g;
};

type Props2D = {
  pos?: [number, number, number?];
  rot?: number;
  escala?: [number, number];
  cor: string;
  opacidade?: number;
  sombra?: boolean;
};

const pos3 = (p?: [number, number, number?]): V3 => (p ? [p[0], p[1], p[2] ?? 0] : [0, 0, 0]);

export const Ret: React.FC<Props2D & { w: number; h: number; r?: number }> = ({
  w,
  h,
  r = 0,
  pos,
  rot = 0,
  escala,
  cor,
  opacidade = 1,
  sombra = true,
}) => (
  <mesh
    geometry={geoRetArredondado(w, h, r)}
    position={pos3(pos)}
    rotation={[0, 0, rot]}
    scale={escala ? [escala[0], escala[1], 1] : undefined}
    castShadow={sombra}
  >
    <meshBasicMaterial color={cor} transparent={opacidade < 1} opacity={opacidade} side={THREE.DoubleSide} />
  </mesh>
);

export const Disco: React.FC<Props2D & { r: number; inicio?: number; arco?: number }> = ({
  r,
  inicio = 0,
  arco = Math.PI * 2,
  pos,
  rot = 0,
  escala,
  cor,
  opacidade = 1,
  sombra = true,
}) => (
  <mesh position={pos3(pos)} rotation={[0, 0, rot]} scale={escala ? [escala[0], escala[1], 1] : undefined} castShadow={sombra}>
    <circleGeometry args={[r, 40, inicio, arco]} />
    <meshBasicMaterial color={cor} transparent={opacidade < 1} opacity={opacidade} side={THREE.DoubleSide} />
  </mesh>
);

export const Anel: React.FC<Props2D & { r: number; espessura: number; inicio?: number; arco?: number }> = ({
  r,
  espessura,
  inicio = 0,
  arco = Math.PI * 2,
  pos,
  rot = 0,
  escala,
  cor,
  sombra = false,
}) => (
  <mesh position={pos3(pos)} rotation={[0, 0, rot]} scale={escala ? [escala[0], escala[1], 1] : undefined} castShadow={sombra}>
    <ringGeometry args={[r - espessura / 2, r + espessura / 2, 40, 1, inicio, arco]} />
    <meshBasicMaterial color={cor} side={THREE.DoubleSide} />
  </mesh>
);

export const Triangulo: React.FC<Props2D & { pontos: [number, number][] }> = ({ pontos, pos, cor, sombra = false }) => {
  const chave = JSON.stringify(pontos);
  const geo = useMemo(() => {
    const s = new THREE.Shape(pontos.map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.ShapeGeometry(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return (
    <mesh geometry={geo} position={pos3(pos)} castShadow={sombra}>
      <meshBasicMaterial color={cor} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ---------------------------------------------------------------------------
// Texturas desenhadas em <canvas> (placas, calendário, jornal...)
// Espera as fontes carregarem para não desenhar com a fonte errada.
// ---------------------------------------------------------------------------

export function useTexturaCanvas(
  largura: number,
  altura: number,
  desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  chave: string,
  fontes: string[] = [],
) {
  const [pronto, setPronto] = useState(fontes.length === 0);
  const [handle] = useState(() => (fontes.length ? delayRender(`Fontes da textura ${chave}`) : null));
  useEffect(() => {
    if (handle === null) return;
    Promise.all(fontes.map((f) => document.fonts.load(f)))
      .catch(() => null)
      .finally(() => {
        setPronto(true);
        continueRender(handle);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = largura;
    c.height = altura;
    const ctx = c.getContext("2d")!;
    desenhar(ctx, largura, altura);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, chave, largura, altura]);
}

export const PlanoTextura: React.FC<{
  textura: THREE.Texture;
  w: number;
  h: number;
  pos?: V3;
  rot?: V3;
  basico?: boolean;
  sombra?: boolean;
  transparente?: boolean;
}> = ({ textura, w, h, pos, rot, basico = true, sombra = false, transparente = false }) => (
  <mesh position={pos} rotation={rot} castShadow={sombra} receiveShadow={!basico}>
    <planeGeometry args={[w, h]} />
    {basico ? (
      <meshBasicMaterial map={textura} transparent={transparente} side={THREE.DoubleSide} />
    ) : (
      <meshToonMaterial map={textura} transparent={transparente} />
    )}
  </mesh>
);
