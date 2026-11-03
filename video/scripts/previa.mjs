// Renderiza alguns frames-chave em PNG e monta uma folha de contato (out/previa/folha.jpg).
// Uso: npm run previa                -> frames distribuídos pelo vídeo
//      npm run previa -- 120 300 900 -> frames específicos
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out", "previa");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const gl = process.env.REMOTION_GL ?? "angle";
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.REMOTION_CHROME ?? null,
  chromiumOptions: { gl },
});
const composition = await selectComposition({ serveUrl, id: "CurtaViral", puppeteerInstance: browser, chromiumOptions: { gl } });

const pedidos = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const frames = pedidos.length
  ? pedidos
  : Array.from({ length: 12 }, (_, i) => Math.round(((i + 0.5) / 12) * (composition.durationInFrames - 1)));

for (const frame of frames) {
  const output = path.join(OUT, `frame-${String(frame).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, output, frame, puppeteerInstance: browser, scale: 0.5, chromiumOptions: { gl } });
  console.log("ok", path.relative(ROOT, output));
}
await browser.close({ silent: true });

const colunas = Math.min(frames.length, 6);
spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", path.join(OUT, "frame-*.png"), "-vf", `scale=270:-1,tile=${colunas}x${Math.ceil(frames.length / colunas)}:padding=6:color=white`, "-frames:v", "1", path.join(OUT, "folha.jpg")]);
console.log("folha:", path.relative(ROOT, path.join(OUT, "folha.jpg")));
