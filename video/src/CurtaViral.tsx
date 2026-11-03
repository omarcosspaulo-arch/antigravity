import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { CenaCarta } from "./cenas/Carta";
import { CenaChefe } from "./cenas/Chefe";
import { CenaEscritorio } from "./cenas/Escritorio";
import { CenaFinal } from "./cenas/Final";
import { Gancho as CenaGancho } from "./cenas/Gancho";
import { CenaInventario } from "./cenas/Inventario";
import { CenaPorta } from "./cenas/Porta";
import { CenaPredio } from "./cenas/Predio";
import { CenaRevelacao } from "./cenas/Revelacao";
import { CenaTempo } from "./cenas/Tempo";
import type { PropsCena } from "./cenas/tipos";
import { Legendas } from "./camadas/Legendas";
import { Gancho, Som, Vinheta } from "./camadas/ui";
import { DURACAO, montarCenas, quandoAbs, seg, timeline } from "./timeline";

// Cada "cena" do roteiro.json aponta para um destes componentes.
const CENAS: Record<string, React.FC<PropsCena>> = {
  gancho: CenaGancho,
  escritorio: CenaEscritorio,
  chefe: CenaChefe,
  porta: CenaPorta,
  inventario: CenaInventario,
  tempo: CenaTempo,
  predio: CenaPredio,
  carta: CenaCarta,
  revelacao: CenaRevelacao,
  final: CenaFinal,
};

// Cenas em que as legendas somem (o texto já está na tela)
const SEM_LEGENDA = ["revelacao"];

const Trilha: React.FC<{ cortes: number[] }> = ({ cortes }) => {
  const virada = quandoAbs("propósito") || Math.round(DURACAO / 2);
  return (
    <>
      {timeline.falas.map((f) => (
        <Sequence key={f.id} from={seg(f.inicio)} name={`voz ${f.id}`} layout="none">
          <Audio src={staticFile(f.arquivo)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={virada + 6} name="trilha curiosa" layout="none">
        <Audio
          src={staticFile("sons/trilha-curiosa.wav")}
          volume={(fr) => interpolate(fr, [0, 6, virada - 4, virada + 4], [0, 0.2, 0.2, 0], { extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Sequence from={virada} name="trilha tensa" layout="none">
        <Audio
          src={staticFile("sons/trilha-tensa.wav")}
          volume={(fr) =>
            interpolate(fr, [0, 20, DURACAO - virada - 40, DURACAO - virada], [0, 0.32, 0.32, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>
      {cortes.slice(1).map((c) => (
        <Som key={c} arquivo="whoosh.wav" em={c - 3} volume={0.3} />
      ))}
    </>
  );
};

export const CurtaViral: React.FC = () => {
  const cenas = useMemo(montarCenas, []);
  const ocultar = cenas.filter((c) => SEM_LEGENDA.includes(c.nome)).map((c) => [c.inicio, c.inicio + c.duracao] as [number, number]);
  const fimGancho = seg(timeline.falas[0].fim) - 6;
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {cenas.map((c) => {
        const Comp = CENAS[c.nome];
        if (!Comp) throw new Error(`Cena "${c.nome}" não existe em CENAS (src/CurtaViral.tsx)`);
        return (
          <Sequence key={c.nome + c.inicio} from={c.inicio} durationInFrames={c.duracao} name={c.nome}>
            <Comp cena={c} />
          </Sequence>
        );
      })}
      <Vinheta />
      <Gancho texto={timeline.gancho} ate={fimGancho} />
      <Legendas ocultar={ocultar} />
      <Trilha cortes={cenas.map((c) => c.inicio)} />
    </AbsoluteFill>
  );
};
