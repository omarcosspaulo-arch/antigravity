#!/usr/bin/env python3
"""Linha do tempo de fotos para vídeo.

As fotos entram pela direita e saem pela esquerda, uma a cada poucos frames,
em tela cheia (--mode fullscreen) ou passando por trás da pessoa que está
falando, com efeito de foto antiga (--mode behind).

Exemplos:
  # aplica no vídeo a partir de 12.4 s, com as fotos passando por trás dela
  python render.py fotos/ --video video.mp4 --start 12.4 --mode behind -o final.mp4

  # prévia sobre uma imagem parada, sem o vídeo
  python render.py fotos/ --background still.jpg --mode fullscreen -o previa.mp4
"""

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from fractions import Fraction
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
DRIFT = 0.1     # share of the motion spread evenly over the slot, so held photos keep drifting left
SAMPLES = 12    # sub-frames averaged per frame for motion blur
LUMA = np.float32([0.299, 0.587, 0.114])


def natural_key(path):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def load_photos(folder):
    paths = sorted((p for p in Path(folder).iterdir() if p.suffix.lower() in PHOTO_EXTS), key=natural_key)
    if not paths:
        sys.exit(f"nenhuma foto encontrada em {folder}")
    return paths, [ImageOps.exif_transpose(Image.open(p)).convert("RGB") for p in paths]


def cover(img, w, h, focus=(0.5, 0.5)):
    """Scale and crop img to exactly w x h, keeping the focus point (fractions of width/height) in frame."""
    if img.width * h > img.height * w:
        cw, ch = img.height * w / h, img.height
    else:
        cw, ch = img.width, img.width * h / w
    x0 = min(max(focus[0] * img.width - cw / 2, 0), img.width - cw)
    y0 = min(max(focus[1] * img.height - ch / 2, 0), img.height - ch)
    return img.resize((w, h), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))


def vintage(img, rng):
    """Faded warm print: low contrast, soft, grainy, vignetted, with dust and a few scratches."""
    a = np.asarray(img, np.float32) / 255
    h, w = a.shape[:2]
    lum = a @ LUMA
    sepia = np.stack([lum * 1.07, lum * 0.95, lum * 0.76], axis=-1)
    a = 0.08 + 0.84 * (0.78 * sepia + 0.22 * a)
    a = np.asarray(Image.fromarray(to_u8(a)).filter(ImageFilter.GaussianBlur(max(0.6, w / 1000))), np.float32) / 255

    yy, xx = np.ogrid[-1:1:h * 1j, -1:1:w * 1j]
    a *= (1 - 0.5 * ((xx * xx + yy * yy) / 2) ** 1.5)[..., None]
    grain = rng.normal(0, 1, (h // 2 + 1, w // 2 + 1)).astype(np.float32)
    a += 0.045 * np.asarray(Image.fromarray(grain, "F").resize((w, h), Image.BILINEAR))[..., None]

    out = Image.fromarray(to_u8(a))
    d = ImageDraw.Draw(out, "RGBA")
    for _ in range(w * h // 9000):
        x, y, r = rng.uniform(0, w), rng.uniform(0, h), rng.uniform(0.5, 2.2)
        v = 25 if rng.random() < 0.6 else 235
        d.ellipse((x - r, y - r, x + r, y + r), fill=(v, v, v, int(rng.uniform(60, 160))))
    for _ in range(rng.integers(1, 4)):
        x, y0 = rng.uniform(0.05, 0.95) * w, rng.uniform(0, 0.5) * h
        y1 = y0 + rng.uniform(0.3, 1) * h
        d.line((x, y0, x + rng.uniform(-6, 6), y1), fill=(240, 235, 220, int(rng.uniform(40, 90))), width=1)
    return out


def paper(w, h, rng, old):
    a = np.empty((h, w, 3), np.float32)
    a[:] = np.float32([232, 224, 204] if old else [246, 245, 241]) / 255
    a += rng.normal(0, 0.012, (h, w, 1)).astype(np.float32)
    if old:
        yy, xx = np.ogrid[-1:1:h * 1j, -1:1:w * 1j]
        a -= (np.maximum(abs(xx), abs(yy)) ** 6)[..., None] * np.float32([0.06, 0.09, 0.16])
    return Image.fromarray(to_u8(a))


def make_card(photo, box, angle, rng, old):
    """Bordered print that fits in a box x box square, rotated, with a drop shadow.

    Returns the RGBA image and the width the print occupies on the strip (without the shadow).
    """
    b = round(box * 0.035)
    ratio = photo.width / photo.height
    iw = min(box - 2 * b, (box - 2 * b) * ratio)
    iw, ih = round(iw), round(iw / ratio)
    pic = cover(photo, iw, ih)
    if old:
        pic = vintage(pic, rng)
    card = paper(iw + 2 * b, ih + 2 * b, rng, old)
    card.paste(pic, (b, b))
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=b // 2, fill=255)
    card.putalpha(mask)
    card = card.rotate(angle, Image.BICUBIC, expand=True)

    pad = round(box * 0.06)
    out = Image.new("RGBA", (card.width + 2 * pad, card.height + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    shadow.putalpha(card.getchannel("A").point(lambda v: v * 0.5))
    out.alpha_composite(shadow, (pad + round(box * 0.012), pad + round(box * 0.02)))
    out = out.filter(ImageFilter.GaussianBlur(box * 0.02))
    out.alpha_composite(card, (pad, pad))
    return out, card.width


def build_strip(cards, ys, gap, W, H):
    """Lay the cards side by side on a transparent strip with one empty screen on each end.

    Returns the premultiplied RGBA strip and the camera keyframes: where the centre of the
    screen sits on the strip before the first card, at each card, and after the last card.
    """
    centers, x = [], W
    for _, fw in cards:
        centers.append(x + fw / 2)
        x += fw + gap
    strip = Image.new("RGBA", (round(x - gap + W), H), (0, 0, 0, 0))
    for (img, _), cx, cy in zip(cards, centers, ys):
        left, top = round(cx - img.width / 2), round(cy - img.height / 2)
        strip.alpha_composite(img, (max(left, 0), max(top, 0)), (max(-left, 0), max(-top, 0)))

    a = np.asarray(strip)
    pm = a.copy()
    pm[..., :3] = a[..., :3].astype(np.uint16) * a[..., 3:] // 255
    keys = [centers[0] - (W + cards[0][1]) / 2, *centers, centers[-1] + (W + cards[-1][1]) / 2]
    return pm, keys


def camera(keys, u, per_photo):
    """Strip position of the screen centre at slot time u.

    Card i is centred at u = i; u = -1 and u = n are the empty screens before the first and
    after the last card. Between two cards the camera holds (drifting slightly) and whips to
    the next one in about one frame, so each photo reads clearly for per_photo - 1 frames.
    """
    j = min(max(u + 1, 0), len(keys) - 1 - 1e-9)
    i, f = int(j), j - int(j)
    t = min(max((f - 0.5) * per_photo / 1.5 + 0.5, 0), 1)
    e = DRIFT * f + (1 - DRIFT) * t * t * (3 - 2 * t)
    return keys[i] + (keys[i + 1] - keys[i]) * e


def layer_at(strip, keys, k, per_photo, W, shutter):
    """Premultiplied RGBA float layer for effect frame k, motion-blurred over the shutter interval.

    Frame k sits at slot time -0.5 + k / per_photo, so frame 0 is the first photo whipping in,
    every per_photo-th frame is a whip between photos and the last frame is the last one whipping out.
    """
    times = [k] if shutter <= 0 else [k + shutter * ((s + 0.5) / SAMPLES - 0.5) for s in range(SAMPLES)]
    limit = strip.shape[1] - W
    xs = Counter(min(max(round(camera(keys, t / per_photo - 0.5, per_photo) - W / 2), 0), limit) for t in times)
    acc = np.zeros((strip.shape[0], W, 4), np.float32)
    for x0, count in xs.items():
        acc += strip[:, x0:x0 + W] * np.float32(count)
    return acc / (len(times) * 255)


class Matter:
    """Person matte (1 = person) for a frame, from rembg's human segmentation."""

    def __init__(self, model):
        try:
            from rembg import new_session, remove
        except ImportError:
            sys.exit("o modo 'behind' precisa do rembg: pip install -r requirements.txt")
        self.session, self.remove = new_session(model), remove

    def __call__(self, frame):
        m = self.remove(Image.fromarray(frame), session=self.session, only_mask=True)
        # Tighten the soft edge so the backdrop around the head does not ghost over the photos
        t = np.clip((np.asarray(m, np.float32) / 255 - 0.3) / 0.5, 0, 1)
        return t * t * (3 - 2 * t)


def auto_card_y(matte, box, H):
    """Card centre height so the top of the head covers the lower part of the cards."""
    rows = np.nonzero(matte.mean(axis=1) > 0.03)[0]
    y = rows[0] - 0.1 * box if len(rows) else 0.4 * H
    return min(max(y, box / 2 + 0.04 * H), H - box / 2 - 0.04 * H)


def to_u8(a):
    return (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)


def probe(video):
    cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-of", "json", "-show_entries",
           "stream=width,height,avg_frame_rate:stream_side_data=rotation:stream_tags=rotate", video]
    s = json.loads(subprocess.run(cmd, capture_output=True, text=True, check=True).stdout)["streams"][0]
    w, h = s["width"], s["height"]
    rot = int(s.get("tags", {}).get("rotate", 0)) or next(
        (int(d["rotation"]) for d in s.get("side_data_list", []) if "rotation" in d), 0)
    if rot % 180:
        w, h = h, w
    return w, h, Fraction(s["avg_frame_rate"])


def video_frames(video, W, H, fps):
    cmd = ["ffmpeg", "-v", "error", "-i", video, "-map", "0:v:0", "-vf", f"fps={fps}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    while len(buf := proc.stdout.read(size)) == size:
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    proc.wait()


def encoder(path, W, H, fps, pix_fmt, codec_args, extra_inputs=()):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", pix_fmt, "-s", f"{W}x{H}",
           "-framerate", str(fps), "-i", "-", *extra_inputs, *codec_args, str(path)]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def parse_time(text):
    secs = 0.0
    for part in text.split(":"):
        secs = secs * 60 + float(part)
    return secs


def parse_args():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("fotos", help="pasta com as fotos, em ordem pelo nome (ex.: 2011.jpg ... 2024.jpg)")
    p.add_argument("-o", "--out", required=True, help="vídeo de saída (.mp4)")
    p.add_argument("--mode", choices=["fullscreen", "behind"], default="behind",
                   help="tela cheia ou passando por trás da pessoa (padrão: behind)")
    p.add_argument("--video", help="vídeo original; a saída é o vídeo inteiro com o efeito aplicado")
    p.add_argument("--start", default="0", help="quando o efeito começa no vídeo (segundos ou mm:ss.ms)")
    p.add_argument("--background", help="sem --video: imagem parada usada como fundo da prévia")
    p.add_argument("--size", default="1080x1920", help="sem --video: resolução (padrão 1080x1920)")
    p.add_argument("--fps", default="30", help="sem --video: frames por segundo (padrão 30)")
    p.add_argument("--pad", type=float, default=0.6, help="sem --video: segundos de fundo antes e depois")
    p.add_argument("--frames-per-photo", type=int, default=3, help="frames de cada foto (padrão 3)")
    p.add_argument("--shutter", type=float, default=0.5,
                   help="desfoque de movimento, fração do frame (0 = sem desfoque; padrão 0.5)")
    p.add_argument("--vintage", action=argparse.BooleanOptionalAction,
                   help="efeito de foto antiga (padrão: ligado no modo behind, desligado no fullscreen)")
    p.add_argument("--card-size", type=float, default=0.62,
                   help="behind: lado máximo das fotos, fração do menor lado do vídeo (padrão 0.62)")
    p.add_argument("--card-y", type=float,
                   help="behind: altura do centro das fotos, fração da altura (padrão: automático, atrás da cabeça)")
    p.add_argument("--focus", action="append", default=[], metavar="FOTO=X,Y",
                   help="fullscreen: ponto que não pode ser cortado, ex.: 03.jpg=0.3,0.4 (pode repetir)")
    p.add_argument("--layer-out", help="também exporta só a camada das fotos com transparência (ProRes 4444 .mov)")
    p.add_argument("--matte-model", default="u2net_human_seg", help="modelo de recorte do rembg")
    p.add_argument("--seed", type=int, default=7)
    return p.parse_args()


def main():
    args = parse_args()
    paths, photos = load_photos(args.fotos)
    focus = {}
    for item in args.focus:
        name, xy = item.split("=")
        focus[name] = tuple(float(v) for v in xy.split(","))

    if args.video:
        W, H, fps = probe(args.video)
    else:
        W, H = (int(v) for v in args.size.lower().split("x"))
        fps = Fraction(args.fps)
    per_photo = args.frames_per_photo
    n_frames = len(photos) * per_photo + 1
    old = args.vintage if args.vintage is not None else args.mode == "behind"
    rng = np.random.default_rng(args.seed)

    if args.video:
        first = round(parse_time(args.start) * fps)
        frames = video_frames(args.video, W, H, fps)
        out = encoder(args.out, W, H, fps, "rgb24",
                      ["-map", "0:v", "-map", "1:a?", "-c:a", "aac", "-b:a", "256k", "-c:v", "libx264",
                       "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
                      ["-i", args.video])
    else:
        bg = np.asarray(cover(ImageOps.exif_transpose(Image.open(args.background)).convert("RGB"), W, H)
                        if args.background else Image.new("RGB", (W, H)))
        pad = round(args.pad * fps)
        first = pad
        frames = (bg for _ in range(pad + n_frames + pad))
        out = encoder(args.out, W, H, fps, "rgb24",
                      ["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
                       "-movflags", "+faststart"])
    layer_out = args.layer_out and encoder(args.layer_out, W, H, fps, "rgba",
                                           ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le"])

    matter = Matter(args.matte_model) if args.mode == "behind" and (args.video or args.background) else None
    strip = keys = None
    rendered = 0
    for idx, frame in enumerate(frames):
        k = idx - first
        if 0 <= k < n_frames:
            matte = matter(frame) if matter else None
            if strip is None:
                if args.mode == "fullscreen":
                    imgs = (cover(ph, W, H, focus.get(path.name, (0.5, 0.5))) for path, ph in zip(paths, photos))
                    cards = [((vintage(im, rng) if old else im).convert("RGBA"), W) for im in imgs]
                    strip, keys = build_strip(cards, [H / 2] * len(cards), 0, W, H)
                else:
                    box = round(args.card_size * min(W, H))
                    y = args.card_y * H if args.card_y is not None else (
                        auto_card_y(matte, box, H) if matte is not None else 0.4 * H)
                    cards = [make_card(ph, box, (1 if i % 2 else -1) * rng.uniform(1.5, 3.5), rng, old)
                             for i, ph in enumerate(photos)]
                    ys = [y + rng.uniform(-0.02, 0.02) * H for _ in cards]
                    strip, keys = build_strip(cards, ys, round(0.06 * min(W, H)), W, H)

            layer = layer_at(strip, keys, k, per_photo, W, args.shutter)
            if matte is not None:
                layer *= (1 - matte)[..., None]
            alpha = layer[..., 3:]
            frame = to_u8(layer[..., :3] + frame / np.float32(255) * (1 - alpha))
            if layer_out:
                straight = np.where(alpha > 0, layer[..., :3] / np.maximum(alpha, 1e-6), 0)
                layer_out.stdin.write(to_u8(np.concatenate([straight, alpha], axis=-1)).tobytes())
            rendered += 1
        out.stdin.write(np.ascontiguousarray(frame).tobytes())

    for proc in (out, layer_out):
        if proc:
            proc.stdin.close()
            proc.wait()
    if rendered < n_frames:
        print(f"aviso: o vídeo acabou antes do fim do efeito ({rendered} de {n_frames} frames)", file=sys.stderr)
    print(f"{len(photos)} fotos, {n_frames} frames de efeito ({float(n_frames / fps):.2f} s a {float(fps):g} fps) -> {args.out}")


if __name__ == "__main__":
    main()
