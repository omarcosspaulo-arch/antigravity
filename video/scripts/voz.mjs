// Gera a narração (um .wav por fala em public/voz/) e o arquivo de tempos
// src/timeline.json, que sincroniza cenas e legendas de uma palavra.
//
// Uso:
//   npm run voz                 -> sintetiza todas as falas com o Piper (TTS local)
//   npm run voz -- --manter     -> NÃO sintetiza: usa os .wav que já estão em
//                                  public/voz/ (ex.: gravados por você ou
//                                  exportados do ElevenLabs) e só recalcula os tempos
//
// Variáveis de ambiente:
//   PIPER_CMD  comando do Piper (padrão: "piper"; ex.: "python3 -m piper")
//   PIPER_VOZ  caminho do modelo .onnx (padrão: vozes/pt_BR-faber-medium.onnx)

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VOZ_DIR = path.join(ROOT, "public", "voz");
const BRUTO_DIR = path.join(ROOT, ".cache", "voz-bruta");
const FPS = 30;
const SAMPLE_RATE = 48000;

const manter = process.argv.includes("--manter");
const roteiro = JSON.parse(fs.readFileSync(path.join(ROOT, "roteiro.json"), "utf8"));
const cfgVoz = roteiro.voz ?? {};

fs.mkdirSync(VOZ_DIR, { recursive: true });
fs.mkdirSync(BRUTO_DIR, { recursive: true });

const piperCmd = (process.env.PIPER_CMD ?? "piper").split(" ").filter(Boolean);
const piperVoz = process.env.PIPER_VOZ ?? path.join(ROOT, "vozes", "pt_BR-faber-medium.onnx");

// ---------- utilidades ----------

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) {
    throw new Error(`Falhou: ${cmd} ${args.join(" ")}\n${r.stderr ?? ""}`);
  }
  return r;
};

const limparMarcacao = (s) => s.replace(/\*/g, "");

/** Lê um WAV PCM 16-bit e devolve as amostras do primeiro canal como Float32Array. */
function lerWav(arquivo) {
  const buf = fs.readFileSync(arquivo);
  let pos = 12;
  let canais = 1;
  let taxa = SAMPLE_RATE;
  let bits = 16;
  while (pos < buf.length - 8) {
    const id = buf.toString("ascii", pos, pos + 4);
    const tam = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") {
      canais = buf.readUInt16LE(pos + 10);
      taxa = buf.readUInt32LE(pos + 12);
      bits = buf.readUInt16LE(pos + 22);
    } else if (id === "data") {
      if (bits !== 16) throw new Error(`${arquivo}: só suportamos PCM 16-bit`);
      const n = Math.floor(Math.min(tam, buf.length - pos - 8) / 2 / canais);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(pos + 8 + i * 2 * canais) / 32768;
      return { amostras: out, taxa };
    }
    pos += 8 + tam + (tam % 2);
  }
  throw new Error(`${arquivo}: WAV sem bloco "data"`);
}

/** Encontra trechos de fala separados por silêncios (pausas de vírgula/ponto). */
function trechosDeFala({ amostras, taxa }) {
  const janela = Math.round(taxa * 0.01); // 10 ms
  const energia = [];
  for (let i = 0; i + janela <= amostras.length; i += janela) {
    let s = 0;
    for (let j = 0; j < janela; j++) s += amostras[i + j] ** 2;
    energia.push(Math.sqrt(s / janela));
  }
  const pico = Math.max(...energia, 1e-9);
  const limiar = pico * 0.045; // ~ -27 dB do pico
  const falando = energia.map((e) => e > limiar);

  const trechos = [];
  let ini = -1;
  let silencio = 0;
  const MIN_PAUSA = 9; // 90 ms
  for (let k = 0; k < falando.length; k++) {
    if (falando[k]) {
      if (ini < 0) ini = k;
      silencio = 0;
    } else if (ini >= 0) {
      silencio++;
      if (silencio === MIN_PAUSA) {
        trechos.push([ini, k - MIN_PAUSA + 1]);
        ini = -1;
        silencio = 0;
      }
    }
  }
  if (ini >= 0) trechos.push([ini, falando.length - silencio]);
  return trechos.map(([a, b]) => ({ inicio: a * 0.01, fim: b * 0.01 }));
}

/** Estimativa de sílabas em português (grupos de vogais). */
const silabas = (p) =>
  Math.max(1, (p.toLowerCase().match(/[aeiouáéíóúâêôãõàüy]+/g) ?? []).length);

/** Divide o texto exibido em palavras, marcando destaques (*palavra*) e frases. */
function tokenizar(texto) {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((bruto) => {
      const destaque = /\*/.test(bruto);
      const limpo = limparMarcacao(bruto);
      const fimDeFrase = /[,.:;?!…]$/.test(limpo);
      return { texto: limpo, destaque, fimDeFrase, peso: silabas(limpo) };
    });
}

/** Distribui as palavras de uma frase dentro de um trecho de áudio. */
function distribuir(palavras, inicio, fim) {
  const total = palavras.reduce((s, p) => s + p.peso, 0);
  let t = inicio;
  return palavras.map((p) => {
    const dur = ((fim - inicio) * p.peso) / total;
    const r = { ...p, inicio: t, fim: t + dur };
    t += dur;
    return r;
  });
}

function alinhar(palavras, trechos, duracao) {
  // agrupa palavras em frases (separadas por pontuação)
  const frases = [[]];
  palavras.forEach((p, i) => {
    frases[frases.length - 1].push(p);
    if (p.fimDeFrase && i < palavras.length - 1) frases.push([]);
  });

  let segs = trechos.length ? [...trechos] : [{ inicio: 0, fim: duracao }];
  // se o áudio tem mais pausas que o texto, junta as pausas mais curtas
  while (segs.length > frases.length) {
    let menor = 0;
    for (let i = 1; i < segs.length - 1; i++) {
      if (segs[i + 1].inicio - segs[i].fim < segs[menor + 1].inicio - segs[menor].fim) menor = i;
    }
    segs.splice(menor, 2, { inicio: segs[menor].inicio, fim: segs[menor + 1].fim });
  }
  if (segs.length === frases.length) {
    return frases.flatMap((f, i) => distribuir(f, segs[i].inicio, segs[i].fim));
  }
  // menos pausas que frases: distribui tudo proporcionalmente, com peso extra na pontuação
  const comPausa = palavras.map((p) => ({ ...p, peso: p.peso + (p.fimDeFrase ? 1 : 0) }));
  return distribuir(comPausa, segs[0].inicio, segs[segs.length - 1].fim).map((p, i) => ({
    ...p,
    fim: p.fim - (palavras[i].fimDeFrase ? (p.fim - p.inicio) * 0.35 : 0),
  }));
}

// ---------- síntese ----------

function sintetizar(fala) {
  const final = path.join(VOZ_DIR, `${fala.id}.wav`);
  if (manter) {
    if (!fs.existsSync(final)) throw new Error(`--manter: falta ${path.relative(ROOT, final)}`);
    return final;
  }
  const bruto = path.join(BRUTO_DIR, `${fala.id}.wav`);
  const texto = fala.tts ?? limparMarcacao(fala.texto);
  run(piperCmd[0], [
    ...piperCmd.slice(1),
    "-m", piperVoz,
    "--length-scale", String(cfgVoz.velocidade ?? 0.85),
    "-f", bruto,
  ], { input: texto });

  // corta silêncio das pontas, dá "cara de narrador" (compressão) e normaliza volume
  const filtros = [
    "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02",
    "areverse",
    "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.04",
    "areverse",
    "highpass=f=75",
    "equalizer=f=3200:t=q:w=1.2:g=3",
    "acompressor=threshold=-20dB:ratio=3:attack=4:release=80:makeup=2",
    "loudnorm=I=-15:TP=-1.5:LRA=7",
  ].join(",");
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", bruto, "-af", filtros, "-ar", String(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", final]);
  return final;
}

// ---------- montagem da linha do tempo ----------

const falas = [];
let t = 0.2;
roteiro.falas.forEach((fala, i) => {
  const arquivo = sintetizar(fala);
  const wav = lerWav(arquivo);
  const duracao = wav.amostras.length / wav.taxa;
  const trechos = trechosDeFala(wav);
  const palavras = alinhar(tokenizar(fala.texto), trechos, duracao);

  const anterior = roteiro.falas[i - 1];
  const pausa =
    i === 0 ? 0 : (anterior.cena !== fala.cena ? cfgVoz.pausaEntreCenas ?? 0.3 : cfgVoz.pausaEntreFalas ?? 0.12) + (fala.pausaAntes ?? 0);
  const inicio = t + pausa;
  t = inicio + duracao;

  falas.push({
    id: fala.id,
    cena: fala.cena,
    texto: limparMarcacao(fala.texto),
    arquivo: `voz/${fala.id}.wav`,
    inicio: +inicio.toFixed(3),
    fim: +t.toFixed(3),
    palavras: palavras.map((p) => ({
      texto: p.texto,
      destaque: p.destaque,
      inicio: +(inicio + p.inicio).toFixed(3),
      fim: +(inicio + p.fim).toFixed(3),
    })),
  });
  console.log(`${fala.id}  ${duracao.toFixed(2)}s  ${trechos.length} trecho(s)  "${limparMarcacao(fala.texto)}"`);
});

const timeline = {
  titulo: roteiro.titulo,
  gancho: roteiro.gancho,
  fps: FPS,
  duracao: +(t + 1.8).toFixed(3),
  falas,
};
fs.writeFileSync(path.join(ROOT, "src", "timeline.json"), JSON.stringify(timeline, null, 2) + "\n");
console.log(`\nDuração total: ${timeline.duracao.toFixed(1)}s -> src/timeline.json`);
