import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONTE } from "../fontes";
import { COR } from "../paleta";
import { FPS, seg, timeline } from "../timeline";

// Legendas de UMA palavra por vez, no centro da tela, com "pulo" a cada palavra.

const PALAVRAS = timeline.falas.flatMap((f) => f.palavras);

const limpar = (s: string) => s.replace(/\.{2,}|…/g, "").replace(/[.,:;]+$/g, "").toUpperCase();

export const Legendas: React.FC<{ ocultar?: [number, number][]; topo?: number }> = ({ ocultar = [], topo = 1150 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (ocultar.some(([a, b]) => frame >= a && frame < b)) return null;

  let idx = -1;
  for (let i = 0; i < PALAVRAS.length; i++) {
    if (PALAVRAS[i].inicio <= t + 0.02) idx = i;
    else break;
  }
  if (idx < 0) return null;
  const p = PALAVRAS[idx];
  const prox = PALAVRAS[idx + 1];
  const limite = Math.min(prox ? prox.inicio : Infinity, p.fim + 0.45);
  if (t > limite) return null;

  const df = frame - seg(p.inicio);
  const escala = interpolate(df, [0, 2, 5], [0.7, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const texto = limpar(p.texto);
  const base = p.destaque ? 140 : 120;
  const tamanho = Math.min(base, 960 / Math.max(1, texto.length * 0.76));
  const giro = p.destaque ? (idx % 2 ? -3 : 3) : 0;

  const estilo: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: topo,
    textAlign: "center",
    fontFamily: FONTE,
    fontWeight: 900,
    fontSize: tamanho,
    lineHeight: 1,
    letterSpacing: -1,
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ transform: `scale(${escala}) rotate(${giro}deg)`, transformOrigin: `50% ${topo + tamanho / 2}px` }}>
      <div
        style={{
          ...estilo,
          color: "#000",
          WebkitTextStroke: `${Math.round(tamanho * 0.16)}px #000`,
          textShadow: `0 ${Math.round(tamanho * 0.09)}px 0 #000`,
        }}
      >
        {texto}
      </div>
      <div style={{ ...estilo, color: p.destaque ? COR.amarelo : "#ffffff" }}>{texto}</div>
    </AbsoluteFill>
  );
};
