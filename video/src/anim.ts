import { Easing, interpolate } from "remotion";

export type V3 = [number, number, number];

export const suave = Easing.bezier(0.45, 0, 0.25, 1);
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const elastico = Easing.out(Easing.back(2.4));

/** interpolate com clamp e easing suave por padrão */
export const anim = (
  f: number,
  entrada: [number, number],
  saidaV: [number, number],
  easing: (t: number) => number = suave,
) =>
  interpolate(f, entrada, saidaV, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** escala 0 -> 1 com "pulo" (overshoot), começando no frame `inicio` */
export const pop = (f: number, inicio: number, dur = 9) => anim(f, [inicio, inicio + dur], [0, 1], elastico);

/** Keyframes de vetores: frames crescentes e valores V3, com easing por trecho. */
export function chaves(f: number, frames: number[], valores: V3[], easing = suave): V3 {
  if (f <= frames[0]) return valores[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (f <= frames[i + 1]) {
      const k = easing((f - frames[i]) / Math.max(1, frames[i + 1] - frames[i]));
      const a = valores[i];
      const b = valores[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
  }
  return valores[valores.length - 1];
}

/** número pseudo-aleatório estável a partir de uma semente */
export const aleatorio = (semente: number) => {
  const x = Math.sin(semente * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** tremida de câmera determinística */
export const tremor = (f: number, forca: number): V3 => [
  (aleatorio(f * 1.3) - 0.5) * forca,
  (aleatorio(f * 2.1 + 7) - 0.5) * forca,
  0,
];
