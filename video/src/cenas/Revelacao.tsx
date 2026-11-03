import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { anim, elastico, pop } from "../anim";
import { Som } from "../camadas/ui";
import { FONTE, PILHA_JP } from "../fontes";
import { COR } from "../paleta";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f15 — "Isso tem nome: oidashi-beya. A sala de expulsão."
const KANJI = ["追", "い", "出", "し", "部", "屋"];

export const CenaRevelacao: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const tNome = quando(cena, "nome", 1, 12);
  const tOidashi = quando(cena, "oidashi-beya", 1, 30);
  const tSala = quando(cena, "sala", 1, 70);
  const tExpulsao = quando(cena, "expulsão", 1, 85);
  const passo = Math.max(3, (tOidashi + 8 - tNome) / KANJI.length);
  const inicios = KANJI.map((_, i) => Math.round(tNome + 2 + i * passo));

  const zoom = 1 + anim(f, [0, cena.duracao], [0, 0.06], (t) => t);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, #e8364e 0%, ${COR.vermelhoJP} 45%, #8f0f22 100%)`,
        fontFamily: FONTE,
        color: "#ffffff",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 520,
          width: 860,
          height: 860,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          transform: `scale(${zoom})`,
        }}
      />
      <div style={{ position: "absolute", top: 330, fontWeight: 900, fontSize: 64, letterSpacing: 4, transform: `scale(${pop(f, 0, 10)})` }}>
        ISSO TEM NOME:
      </div>
      <div style={{ position: "absolute", top: 560, display: "flex", gap: 6, transform: `scale(${zoom})` }}>
        {KANJI.map((k, i) => {
          const df = f - inicios[i];
          const s = df < 0 ? 0 : anim(df, [0, 6], [2.4, 1], elastico);
          return (
            <div
              key={k + i}
              style={{
                fontFamily: PILHA_JP,
                fontWeight: 900,
                fontSize: 150,
                lineHeight: 1,
                width: 152,
                textAlign: "center",
                opacity: df < 0 ? 0 : anim(df, [0, 2], [0, 1]),
                transform: `scale(${s})`,
                textShadow: "0 12px 0 rgba(0,0,0,0.3)",
              }}
            >
              {k}
            </div>
          );
        })}
      </div>
      {/* tradução por partes */}
      <div style={{ position: "absolute", top: 760, display: "flex", width: 1040, justifyContent: "center", gap: 6 }}>
        <Rotulo largura={4 * 158 - 6} texto="EXPULSAR" em={tExpulsao} f={f} />
        <Rotulo largura={2 * 158 - 6} texto="SALA" em={tSala} f={f} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 900,
          fontWeight: 900,
          fontSize: 104,
          color: COR.amarelo,
          letterSpacing: 2,
          transform: `scale(${pop(f, tOidashi, 10)})`,
          textShadow: "0 10px 0 rgba(0,0,0,0.35)",
        }}
      >
        OIDASHI-BEYA
      </div>
      <div
        style={{
          position: "absolute",
          top: 1060,
          fontWeight: 900,
          fontSize: 76,
          padding: "10px 28px",
          background: "#ffffff",
          color: COR.vermelhoJP,
          borderRadius: 18,
          transform: `scale(${pop(f, tSala, 10)}) rotate(-2deg)`,
        }}
      >
        = A SALA DE EXPULSÃO
      </div>
      {inicios.map((k, i) => (
        <Som key={i} arquivo="carimbo.wav" em={k} volume={i === 0 || i === 4 ? 0.7 : 0.35} />
      ))}
      <Som arquivo="ding.wav" em={tOidashi} volume={0.35} />
    </AbsoluteFill>
  );
};

const Rotulo: React.FC<{ largura: number; texto: string; em: number; f: number }> = ({ largura, texto, em, f }) => {
  const s = pop(f, em, 8);
  return (
    <div style={{ width: largura, textAlign: "center", opacity: s > 0 ? 1 : 0, transform: `scaleY(${s})` }}>
      <div style={{ height: 14, borderLeft: "6px solid #fff", borderRight: "6px solid #fff", borderBottom: "6px solid #fff", borderRadius: "0 0 10px 10px" }} />
      <div style={{ fontFamily: FONTE, fontWeight: 900, fontSize: 40, marginTop: 10, letterSpacing: 3 }}>{texto}</div>
    </div>
  );
};
