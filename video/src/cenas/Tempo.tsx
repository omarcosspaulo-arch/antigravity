import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { anim, chaves, tremor, V3 } from "../anim";
import { Clarao, Contador, Som } from "../camadas/ui";
import { Camera, Palco } from "../mundo/base";
import type { Pose } from "../mundo/Personagem";
import { CABECA_TANAKA, EstacaoTanaka, Sala } from "../mundo/Sala";
import { Jornal } from "../mundo/objetos";
import { COR } from "../paleta";
import { quando } from "../timeline";
import type { PropsCena } from "./tipos";

// f09–f11 — o tempo passa (timelapse) e vem a reviravolta: "É de propósito."
const MESES = ["ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV"];
const POSES: Pose[] = ["sentado", "queixo", "jornal", "cabecaBaixa", "sentado", "queixo", "jornal", "cabecaBaixa"];
const QUADROS_POR_DIA = 16;

const misturar = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getStyle();

function ceuDoHorario(h: number) {
  const p = ((h % 24) + 24) % 24;
  const sol = p > 6 && p < 18 ? Math.sin(((p - 6) / 12) * Math.PI) : 0;
  const ceu = sol > 0.45 ? misturar(COR.ceuTarde, COR.ceuDia, (sol - 0.45) / 0.4) : misturar(COR.ceuNoite, COR.ceuTarde, sol / 0.45);
  return { sol, ceu };
}

export const CenaTempo: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame();
  const [f09, f10, f11] = cena.falas;
  const tProposito = quando(cena, "propósito", 1, f11.fim - 15);
  const tMas = quando(cena, "mas", 1, f11.inicio + 40);

  // relógio
  let horas: number;
  if (f < f10.inicio) horas = 9 + 8 * anim(f, [0, f10.inicio], [0, 1], (t) => t);
  else if (f < f11.inicio) horas = 17 + ((f - f10.inicio) / QUADROS_POR_DIA) * 24;
  else horas = 17 + ((f11.inicio - f10.inicio) / QUADROS_POR_DIA) * 24;
  if (f >= f11.inicio) horas = Math.floor(horas / 24) * 24 + 15.5 + (f - f11.inicio) / 30 / 60;

  const { sol, ceu } = ceuDoHorario(horas);
  const progresso10 = anim(f, [f10.inicio, f11.inicio], [0, 1], (t) => t);
  const dias = Math.floor((horas - 9) / 24);
  const mes = MESES[Math.min(MESES.length - 1, Math.floor(progresso10 * (MESES.length - 1)))];

  // pose do Tanaka
  let pose: Pose = "sentado";
  let expressao: "tedio" | "triste" | "choque" | "neutro" = "tedio";
  let olhar: [number, number] = [-1, 0.25];
  if (f >= f10.inicio && f < f11.inicio) {
    pose = POSES[dias % POSES.length];
    olhar = [0, -0.3];
  } else if (f >= f11.inicio) {
    pose = f >= tProposito ? "sentado" : "queixo";
    expressao = f >= tProposito ? "choque" : f >= tMas ? "neutro" : "triste";
    olhar = f >= tProposito ? [0, 0] : [0.6, 0.5];
  }

  // câmera: órbita lenta e depois o "zoom da reviravolta"
  const angulo = anim(f, [0, f11.inicio], [0.42, -0.3], (t) => t);
  const raio = 5.6;
  const orbita: V3 = [Math.sin(angulo) * raio, 2.1, -1.2 + Math.cos(angulo) * raio];
  const perto: V3 = [0.25, 1.5, 1.2];
  const pertissimo: V3 = [0.06, 1.42, 0.25];
  const pos = chaves(f, [0, f11.inicio, tProposito - 4, tProposito + 2, cena.duracao], [orbita, orbita, perto, pertissimo, pertissimo]);
  const t = f >= tProposito ? tremor(f, 0.05 * (1 - anim(f, [tProposito, tProposito + 20], [0, 1]))) : [0, 0, 0];
  const camPos: V3 = f < f11.inicio ? orbita : [pos[0] + t[0], pos[1] + t[1], pos[2]];
  const alvo: V3 = f < f11.inicio ? [0, 1.15, -1.2] : chaves(f, [f11.inicio, tProposito], [[0, 1.15, -1.2], [CABECA_TANAKA[0], CABECA_TANAKA[1] - 0.02, CABECA_TANAKA[2]]]);

  const luz = {
    intensidade: 0.5 + 1.7 * sol,
    ambiente: 0.45 + 0.5 * sol,
    hemisferio: 0.5 + 0.7 * sol,
    cor: misturar("#8aa0ff", "#fff1dc", sol),
  };

  const contadorVisivel = anim(f, [f10.inicio, f10.inicio + 8], [0, 1]) * (1 - anim(f, [f11.inicio - 4, f11.inicio + 4], [0, 1]));
  const valorDia = Math.max(1, Math.round(1 + 239 * progresso10 ** 1.6));

  // tique-taque: lento no f09, acelerado no f10
  const tiques: number[] = [];
  for (let k = 8; k < f10.inicio; k += 15) tiques.push(k);
  for (let k = f10.inicio; k < f11.inicio; k += 5) tiques.push(k);

  return (
    <AbsoluteFill>
      <Palco luz={luz} fundo={ceu}>
        <Camera pos={camPos} alvo={alvo} fov={f >= tProposito ? 30 : 34} />
        <Sala horas={horas} ceu={ceu} luzesCidade={1 - sol} vidaPlanta={1 - progresso10 * 0.7} mes={mes}>
          <EstacaoTanaka personagem={{ pose, expressao, olhar, item: pose === "jornal" ? <Jornal /> : undefined }} />
        </Sala>
      </Palco>
      <Contador rotulo="DIA" valor={valorDia} visivel={contadorVisivel} />
      <Clarao em={tProposito} cor={COR.vermelhoJP} dur={16} max={0.55} />
      {tiques.map((k) => (
        <Som key={k} arquivo="tick.wav" em={k} volume={0.25} />
      ))}
      <Som arquivo="boom.wav" em={tProposito} volume={0.9} />
    </AbsoluteFill>
  );
};
