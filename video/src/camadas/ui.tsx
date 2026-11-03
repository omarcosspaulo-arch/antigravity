import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { aleatorio, anim, elastico, pop } from "../anim";
import { FONTE } from "../fontes";
import { COR } from "../paleta";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Efeito sonoro no frame `em` (relativo à sequência atual). */
export const Som: React.FC<{ arquivo: string; em: number; volume?: number; duracao?: number }> = ({
  arquivo,
  em,
  volume = 0.6,
  duracao,
}) => (
  <Sequence from={Math.max(0, Math.round(em))} durationInFrames={duracao} layout="none" name={`som ${arquivo}`}>
    <Audio src={staticFile(`sons/${arquivo}`)} volume={volume} />
  </Sequence>
);

/** Título-gancho no topo durante os primeiros segundos. */
export const Gancho: React.FC<{ texto: string; ate: number }> = ({ texto, ate }) => {
  const f = useCurrentFrame();
  if (f > ate + 10) return null;
  const entra = anim(f, [0, 8], [0, 1], elastico);
  const sai = anim(f, [ate, ate + 10], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          marginTop: 210,
          maxWidth: 900,
          padding: "26px 40px",
          background: "#ffffff",
          borderRadius: 26,
          boxShadow: "0 14px 0 rgba(0,0,0,0.25)",
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 66,
          lineHeight: 1.08,
          textAlign: "center",
          color: COR.tracos,
          transform: `scale(${entra * (1 - sai * 0.2)}) translateY(${-sai * 60}px) rotate(-2deg)`,
          opacity: 1 - sai,
        }}
      >
        {texto.split(" ").map((p, i) => (
          <span key={i} style={{ color: /NADA/i.test(p) ? COR.vermelhoJP : undefined }}>
            {p}{" "}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Escurece as bordas da tela (cara de cinema). */
export const Vinheta: React.FC<{ forca?: number }> = ({ forca = 0.35 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${forca}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Clarão de cor (transições / reviravolta). */
export const Clarao: React.FC<{ em: number; cor?: string; dur?: number; max?: number }> = ({ em, cor = "#ffffff", dur = 12, max = 1 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [em, em + 2, em + dur], [0, max, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: cor, opacity: o }} />;
};

/** Ícone riscado ("nenhum computador", "nenhum telefone"). */
export const IconeRiscado: React.FC<{ tipo: "computador" | "telefone"; em: number; x: number; y: number }> = ({ tipo, em, x, y }) => {
  const f = useCurrentFrame();
  const s = pop(f, em, 10);
  const risco = anim(f, [em + 6, em + 12], [0, 1]);
  if (f < em) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 130,
        top: y - 130,
        width: 260,
        height: 260,
        borderRadius: 48,
        background: "#ffffff",
        boxShadow: "0 16px 0 rgba(0,0,0,0.22)",
        transform: `scale(${s}) rotate(${tipo === "computador" ? -6 : 6}deg)`,
      }}
    >
      <svg viewBox="0 0 100 100" width={260} height={260}>
        {tipo === "computador" ? (
          <g fill="none" stroke={COR.tracos} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
            <rect x={18} y={22} width={64} height={42} rx={5} fill="#6fd3ff" />
            <path d="M50 64 V76 M34 78 H66" />
          </g>
        ) : (
          <g fill="none" stroke={COR.tracos} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
            <rect x={20} y={44} width={60} height={34} rx={8} fill="#ffd38a" />
            <path d="M22 40 Q50 18 78 40" />
            <rect x={38} y={52} width={24} height={16} rx={3} fill="#ffffff" />
          </g>
        )}
        <line
          x1={14}
          y1={86}
          x2={14 + 72 * risco}
          y2={86 - 72 * risco}
          stroke={COR.vermelhoJP}
          strokeWidth={11}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/** Cartão "oficial" com o nome do departamento. */
export const CartaoDepartamento: React.FC<{ em: number; ate: number }> = ({ em, ate }) => {
  const f = useCurrentFrame();
  if (f < em || f > ate + 10) return null;
  const s = pop(f, em, 12);
  const sai = anim(f, [ate, ate + 10], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          marginTop: 170,
          width: 860,
          padding: "34px 30px 38px",
          background: "#fffdf6",
          borderRadius: 22,
          border: "8px solid #1f2a44",
          boxShadow: "0 18px 0 rgba(0,0,0,0.25)",
          textAlign: "center",
          fontFamily: FONTE,
          color: "#1f2a44",
          transform: `scale(${s * (1 - sai)}) rotate(${-3 + sai * 8}deg)`,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: 6, color: COR.vermelhoJP }}>COMUNICADO INTERNO</div>
        <div style={{ fontWeight: 900, fontSize: 54, lineHeight: 1.12, marginTop: 14 }}>
          TRANSFERIDO PARA O
          <br />
          <span style={{ background: COR.amarelo, padding: "0 10px" }}>DEPTO. DE DESENVOLVIMENTO</span>
          <br />
          <span style={{ background: COR.amarelo, padding: "0 10px" }}>DE CARREIRA</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Confete 2D (comemoração da "promoção"). */
export const Confete: React.FC<{ em: number; quantidade?: number }> = ({ em, quantidade = 70 }) => {
  const f = useCurrentFrame() - em;
  if (f < 0) return null;
  const cores = [COR.amarelo, COR.vermelhoJP, "#4c9a7a", "#6fd3ff", "#8a6bd1", "#ffffff"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: quantidade }).map((_, i) => {
        const x0 = 540 + (aleatorio(i) - 0.5) * 300;
        const vx = (aleatorio(i + 100) - 0.5) * 46;
        const vy = -28 - aleatorio(i + 200) * 30;
        const t = f;
        const x = x0 + vx * t;
        const y = 900 + vy * t + 1.1 * t * t;
        const r = aleatorio(i + 300) * 360 + t * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 22,
              height: 34,
              borderRadius: 4,
              background: cores[i % cores.length],
              transform: `rotate(${r}deg) scaleX(${Math.cos(t * 0.3 + i)})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Contador "DIA N" do timelapse. */
export const Contador: React.FC<{ rotulo: string; valor: number; visivel: number }> = ({ rotulo, valor, visivel }) => {
  if (visivel <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          marginTop: 200,
          padding: "16px 40px",
          borderRadius: 999,
          background: "rgba(20,20,30,0.82)",
          color: "#ffffff",
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: 2,
          transform: `scale(${visivel})`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {rotulo} <span style={{ color: COR.amarelo }}>{valor}</span>
      </div>
    </AbsoluteFill>
  );
};

/** Etiqueta com a bandeira do Japão (desenhada, não emoji). */
export const EtiquetaJapao: React.FC<{ em: number; ate: number; texto: string }> = ({ em, ate, texto }) => {
  const f = useCurrentFrame();
  if (f < em || f > ate + 10) return null;
  const s = pop(f, em, 10) * (1 - anim(f, [ate, ate + 10], [0, 1]));
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          marginTop: 200,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "22px 36px",
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 14px 0 rgba(0,0,0,0.25)",
          transform: `scale(${s})`,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: 56,
          color: COR.tracos,
        }}
      >
        <div style={{ width: 120, height: 80, background: "#fff", border: "4px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#bc002d" }} />
        </div>
        {texto}
      </div>
    </AbsoluteFill>
  );
};
