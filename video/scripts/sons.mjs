// Sintetiza trilha e efeitos sonoros (sem samples externos, sem direitos autorais).
// Saída: public/sons/*.wav
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "sons");
const SR = 44100;
fs.mkdirSync(OUT, { recursive: true });

// gerador pseudo-aleatório determinístico (o resultado é sempre igual)
let semente = 1234567;
const rnd = () => {
  semente = (semente * 1664525 + 1013904223) >>> 0;
  return semente / 4294967296;
};
const ruido = () => rnd() * 2 - 1;

function salvar(nome, amostras, ganho = 0.9) {
  let pico = 1e-9;
  for (const v of amostras) pico = Math.max(pico, Math.abs(v));
  const n = amostras.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, (amostras[i] / pico) * ganho));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, nome), buf);
  console.log(`sons/${nome}  ${(n / SR).toFixed(2)}s`);
}

const buffer = (seg) => new Float32Array(Math.round(seg * SR));

/** filtro passa-baixa de 1 polo, in-place; corte pode variar por amostra */
function passaBaixa(x, corte) {
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof corte === "function" ? corte(i / SR) : corte;
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    y += a * (x[i] - y);
    x[i] = y;
  }
  return x;
}
function passaAlta(x, corte) {
  const lp = passaBaixa(Float32Array.from(x), corte);
  for (let i = 0; i < x.length; i++) x[i] -= lp[i];
  return x;
}

/** corda dedilhada (Karplus-Strong) — soa como pizzicato/pluck */
function corda(freq, dur, brilho = 0.5, decaimento = 0.996) {
  const out = buffer(dur);
  const n = Math.max(2, Math.round(SR / freq));
  const linha = new Float32Array(n).map(() => ruido());
  passaBaixa(linha, 800 + brilho * 6000);
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const a = linha[idx];
    const b = linha[(idx + 1) % n];
    linha[idx] = ((a + b) / 2) * decaimento;
    out[i] = a;
    idx = (idx + 1) % n;
  }
  return out;
}

function mixar(destino, fonte, emSeg, ganho = 1) {
  const off = Math.round(emSeg * SR);
  for (let i = 0; i < fonte.length && off + i < destino.length; i++) destino[off + i] += fonte[i] * ganho;
}

const nota = (midi) => 440 * 2 ** ((midi - 69) / 12);

// ---------- efeitos ----------

// whoosh: ruído com filtro varrendo + envelope
{
  const d = 0.5;
  const x = buffer(d).map(() => ruido());
  passaBaixa(x, (t) => 300 + 5000 * Math.sin((Math.PI * t) / d));
  passaAlta(x, 200);
  for (let i = 0; i < x.length; i++) x[i] *= Math.sin((Math.PI * i) / x.length) ** 2;
  salvar("whoosh.wav", x, 0.7);
}

// pop: bolha curta
{
  const x = buffer(0.14);
  let fase = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    fase += (2 * Math.PI * (300 + 900 * Math.exp(-t * 40))) / SR;
    x[i] = Math.sin(fase) * Math.exp(-t * 30);
  }
  salvar("pop.wav", x, 0.8);
}

// tick de relógio
{
  const x = buffer(0.06).map((_, i) => ruido() * Math.exp(-i / (SR * 0.004)));
  passaAlta(x, 2500);
  const y = buffer(0.06).map((_, i) => Math.sin((2 * Math.PI * 3200 * i) / SR) * Math.exp(-i / (SR * 0.006)) * 0.5);
  salvar("tick.wav", x.map((v, i) => v + y[i]), 0.6);
}

// boom grave (reviravolta)
{
  const d = 2.2;
  const x = buffer(d);
  let fase = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    fase += (2 * Math.PI * (38 + 50 * Math.exp(-t * 6))) / SR;
    x[i] = Math.sin(fase) * Math.exp(-t * 1.8) + ruido() * Math.exp(-t * 25) * 0.4;
  }
  passaBaixa(x, 1800);
  salvar("boom.wav", x, 0.95);
}

// carimbo / tambor (revelação do nome)
{
  const d = 0.6;
  const x = buffer(d);
  let fase = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    fase += (2 * Math.PI * (70 + 120 * Math.exp(-t * 30))) / SR;
    x[i] = Math.sin(fase) * Math.exp(-t * 7) + ruido() * Math.exp(-t * 60) * 0.6;
  }
  passaBaixa(x, 2500);
  salvar("carimbo.wav", x, 0.95);
}

// sino (ding)
{
  const d = 1.6;
  const x = buffer(d);
  const base = 1046.5;
  const parciais = [[1, 1, 3], [2.76, 0.5, 5], [5.4, 0.25, 8], [8.93, 0.12, 12]];
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    for (const [r, a, k] of parciais) x[i] += a * Math.sin(2 * Math.PI * base * r * t) * Math.exp(-t * k);
  }
  salvar("ding.wav", x, 0.6);
}

// vento (momento "nada")
{
  const d = 3;
  const x = buffer(d).map(() => ruido());
  passaBaixa(x, (t) => 500 + 400 * Math.sin(t * 3.1) + 250 * Math.sin(t * 7.3));
  passaAlta(x, 120);
  for (let i = 0; i < x.length; i++) x[i] *= Math.sin((Math.PI * i) / x.length);
  salvar("vento.wav", x, 0.6);
}

// ---------- trilhas ----------

// trilha curiosa (antes da reviravolta): pizzicato em Fá lídio, 112 bpm
{
  const bpm = 112;
  const colcheia = 60 / bpm / 2;
  const compassos = 22;
  const x = buffer(compassos * 8 * colcheia + 2);
  const acordes = [
    [53, [65, 69, 72, 76]], // Fmaj7
    [55, [67, 71, 74, 77]], // G (lídio)
    [52, [64, 67, 71, 74]], // Em7
    [50, [62, 65, 69, 72]], // Dm7
  ];
  const padrao = [0, 2, 1, 3, 2, 1, 3, 2];
  for (let c = 0; c < compassos; c++) {
    const [baixo, notas] = acordes[c % acordes.length];
    const t0 = c * 8 * colcheia;
    mixar(x, corda(nota(baixo - 12), 1.2, 0.2, 0.994), t0, 0.9);
    mixar(x, corda(nota(baixo - 12), 0.8, 0.2, 0.994), t0 + 4 * colcheia, 0.6);
    padrao.forEach((p, k) => {
      if (c % 2 === 1 && k === 7) return; // respiro
      mixar(x, corda(nota(notas[p] + 12), 0.5, 0.6, 0.992), t0 + k * colcheia, 0.35 + (k % 2 ? 0 : 0.12));
    });
    // chimbal suave nos contratempos
    for (let k = 1; k < 8; k += 2) {
      const h = buffer(0.05).map((_, i) => ruido() * Math.exp(-i / (SR * 0.01)));
      passaAlta(h, 6000);
      mixar(x, h, t0 + k * colcheia, 0.12);
    }
  }
  for (let i = 0; i < SR; i++) x[x.length - 1 - i] *= i / SR;
  salvar("trilha-curiosa.wav", x, 0.8);
}

// trilha tensa (depois da reviravolta): drone em Ré menor + pulso de coração
{
  const d = 40;
  const x = buffer(d);
  const notas = [38, 45, 50, 53];
  for (const m of notas) {
    const f = nota(m);
    for (const det of [-0.12, 0.12]) {
      let fase = rnd();
      for (let i = 0; i < x.length; i++) {
        fase += (f * (1 + det / 100)) / SR;
        x[i] += ((fase % 1) * 2 - 1) * 0.15; // dente de serra
      }
    }
  }
  passaBaixa(x, (t) => 380 + 220 * Math.sin(t * 0.6));
  passaBaixa(x, 900);
  const pulso = 60 / 72;
  for (let t = 0.5; t < d - 1; t += pulso) {
    for (const [dt, g] of [[0, 1], [0.22, 0.6]]) {
      const b = buffer(0.3);
      let fase = 0;
      for (let i = 0; i < b.length; i++) {
        const tt = i / SR;
        fase += (2 * Math.PI * (55 + 40 * Math.exp(-tt * 30))) / SR;
        b[i] = Math.sin(fase) * Math.exp(-tt * 14);
      }
      mixar(x, b, t + dt, 0.9 * g);
    }
  }
  for (let i = 0; i < SR * 2; i++) {
    x[i] *= i / (SR * 2);
    x[x.length - 1 - i] *= i / (SR * 2);
  }
  salvar("trilha-tensa.wav", x, 0.8);
}
