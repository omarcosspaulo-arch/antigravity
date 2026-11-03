import dados from "./timeline.json";

export type Palavra = { texto: string; destaque: boolean; inicio: number; fim: number };
export type Fala = {
  id: string;
  cena: string;
  texto: string;
  arquivo: string;
  inicio: number;
  fim: number;
  palavras: Palavra[];
};
export type Timeline = {
  titulo: string;
  gancho: string;
  fps: number;
  duracao: number;
  falas: Fala[];
};

export const timeline = dados as Timeline;
export const FPS = timeline.fps;
export const seg = (s: number) => Math.round(s * FPS);
export const DURACAO = seg(timeline.duracao);

/** Fala com tempos em frames, relativos ao início da cena. */
export type FalaLocal = {
  id: string;
  inicio: number;
  fim: number;
  palavras: { texto: string; inicio: number; fim: number }[];
};

export type Cena = {
  nome: string;
  inicio: number; // frame absoluto
  duracao: number;
  falas: FalaLocal[];
};

/** O corte para a próxima cena acontece um pouco antes da fala começar. */
const ANTECIPA_CORTE = 4;

export function montarCenas(): Cena[] {
  const grupos: { nome: string; falas: Fala[] }[] = [];
  for (const f of timeline.falas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nome === f.cena) ultimo.falas.push(f);
    else grupos.push({ nome: f.cena, falas: [f] });
  }
  const inicios = grupos.map((g, i) => (i === 0 ? 0 : seg(g.falas[0].inicio) - ANTECIPA_CORTE));
  return grupos.map((g, i) => {
    const inicio = inicios[i];
    const fim = i < grupos.length - 1 ? inicios[i + 1] : DURACAO;
    return {
      nome: g.nome,
      inicio,
      duracao: fim - inicio,
      falas: g.falas.map((f) => ({
        id: f.id,
        inicio: seg(f.inicio) - inicio,
        fim: seg(f.fim) - inicio,
        palavras: f.palavras.map((p) => ({
          texto: p.texto,
          inicio: seg(p.inicio) - inicio,
          fim: seg(p.fim) - inicio,
        })),
      })),
    };
  });
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "");

/**
 * Frame (relativo à cena) em que uma palavra é dita.
 * `ocorrencia` escolhe a 2ª, 3ª... vez que a palavra aparece na cena.
 */
export function quando(cena: Cena, palavra: string, ocorrencia = 1, padrao = 0): number {
  const alvo = normalizar(palavra);
  let n = 0;
  for (const f of cena.falas) {
    for (const p of f.palavras) {
      if (normalizar(p.texto) === alvo && ++n === ocorrencia) return p.inicio;
    }
  }
  return padrao;
}

/** Frame absoluto em que uma palavra é dita (procura no vídeo inteiro). */
export function quandoAbs(palavra: string, ocorrencia = 1): number {
  const alvo = normalizar(palavra);
  let n = 0;
  for (const f of timeline.falas) {
    for (const p of f.palavras) {
      if (normalizar(p.texto) === alvo && ++n === ocorrencia) return seg(p.inicio);
    }
  }
  return 0;
}
