import { continueRender, delayRender, staticFile } from "remotion";

// Fontes embutidas em public/fontes (licença SIL Open Font License), para o
// render funcionar offline e sempre igual.
//  - Montserrat 800/900: legendas e textos
//  - Noto Sans JP Black (subconjunto): só os kanji/kana usados no vídeo

export const FONTE = "MontserratCurta";
export const FONTE_JP = "NotoSansJPBlack";
export const PILHA_JP = `${FONTE_JP}, "Hiragino Sans", "Noto Sans CJK JP", "Yu Gothic", "WenQuanYi Zen Hei", sans-serif`;

const ARQUIVOS: [string, string, string][] = [
  [FONTE, "fontes/Montserrat-800.ttf", "800"],
  [FONTE, "fontes/Montserrat-900.ttf", "900"],
  [FONTE_JP, "fontes/NotoSansJP-Black-subset.ttf", "900"],
];

if (typeof window !== "undefined" && "FontFace" in window) {
  const handle = delayRender("Carregando fontes");
  Promise.all(
    ARQUIVOS.map(([familia, arquivo, peso]) => {
      const face = new FontFace(familia, `url('${staticFile(arquivo)}') format('truetype')`, { weight: peso });
      return face.load().then(() => document.fonts.add(face));
    }),
  )
    .catch((err) => console.warn("Alguma fonte não carregou", err))
    .finally(() => continueRender(handle));
}
