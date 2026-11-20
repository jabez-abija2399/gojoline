"""
Polishes the guide video (2026-11-20): a mouse pointer that moves to each button the captions
mention and clicks it (a coral ring on the click), and quiet classical piano under it (Bach,
Prelude in C major, BWV 846: the composition is public domain and the recording is rendered
here, note by note, so there is no recording right to clear).

    python3 scripts/guide-video-polish.py <in.mp4> <out.mp4> [clicks.json]

clicks.json: [[seconds, x, y, label], ...] for an edited video; without it, the list below.

One-off authoring tool. Needs ffmpeg, numpy and Pillow. The input is the silent 720p guide video;
the output keeps its picture, timing and captions and adds the pointer and a music track.
"""
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw

W, H, FPS = 1280, 720, 30
CORAL = (255, 91, 53)

# (click time in seconds, x, y): each button the video's captions ask the viewer to press,
# placed from frames just before the screen changes.
CLICKS = [
    (11.05, 962, 30),  # Start free
    (14.45, 640, 250),  # Send me a code
    (32.05, 930, 222),  # Start a new site
    (66.20, 766, 60),  # Phone view
    (84.35, 424, 580),  # Send
    (134.55, 570, 60),  # Photos tab
    (140.20, 600, 494),  # Use in my site
    (146.75, 426, 580),  # Send
    (167.35, 985, 242),  # Bring back (version 3)
    (179.45, 972, 242),  # Bring back (version 4)
    (186.60, 640, 414),  # Publish now
    (229.65, 490, 120),  # Messages
    (234.90, 586, 120),  # Business info
    (249.20, 674, 120),  # Settings
    (264.45, 724, 296),  # Choose Starter
    (280.30, 724, 348),  # Send for checking
]
ARRIVE = 0.9  # seconds of travel before a click
LINGER = 0.7  # seconds the pointer stays after it
RIPPLE = 0.55


def pointer_sprite(scale=4):
    """A classic arrow pointer, white with a dark edge and a soft shadow, drawn large then reduced."""
    pts = [(0, 0), (0, 17), (4, 13), (7, 20), (10, 19), (7, 12), (12.5, 12)]
    size = (20 * scale, 24 * scale)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    p = [(2 * scale + x * scale, 2 * scale + y * scale) for x, y in pts]
    shadow = [(x + 1.5 * scale, y + 1.5 * scale) for x, y in p]
    d.polygon(shadow, fill=(0, 0, 0, 70))
    d.polygon(p, fill=(18, 18, 18, 255))
    inner = [(2 * scale + x * scale, 2 * scale + y * scale) for x, y in [(1.4, 3.2), (1.4, 14.2), (4.4, 11.2), (7.6, 18.4), (8.6, 18.0), (5.6, 10.8), (9.4, 10.8)]]
    d.polygon(inner, fill=(255, 255, 255, 255))
    return img.resize((20 * 2, 24 * 2), Image.LANCZOS).resize((22, 26), Image.LANCZOS)


SPRITE = pointer_sprite()


def ease(t):
    return 3 * t * t - 2 * t * t * t


def overlay_at(t):
    """What to draw at time t: pointer position and press, and the click ring; None when nothing shows."""
    for i, (ct, x, y) in enumerate(CLICKS):
        start, end = ct - ARRIVE, ct + LINGER
        if not (start <= t <= end):
            continue
        prev = CLICKS[i - 1] if i else None
        # Glide from the last button when it was moments ago, otherwise from lower right.
        if prev and ct - prev[0] < 4:
            sx, sy = prev[1], prev[2]
        else:
            sx, sy = min(x + 220, W - 40), min(y + 160, H - 60)
        k = ease(min(1.0, max(0.0, (t - start) / (ARRIVE * 0.85))))
        px, py = sx + (x - sx) * k, sy + (y - sy) * k
        fade = min(1.0, (t - start) / 0.2, (end - t) / 0.25)
        pressed = 0 <= t - ct < 0.15
        ring = (t - ct) / RIPPLE if 0 <= t - ct <= RIPPLE else None
        return px, py, max(0.0, fade), pressed, ring
    return None


def draw(frame, spec):
    px, py, fade, pressed, ring = spec
    img = Image.fromarray(frame).convert("RGBA")
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if ring is not None:
        r = 8 + 26 * ring
        a = int(220 * (1 - ring))
        d.ellipse([px - r, py - r, px + r, py + r], outline=CORAL + (a,), width=4)
        d.ellipse([px - 9, py - 9, px + 9, py + 9], fill=CORAL + (int(110 * (1 - ring)),))
    sprite = SPRITE if not pressed else SPRITE.resize((19, 23), Image.LANCZOS)
    if fade < 1:
        alpha = sprite.getchannel("A").point(lambda v: int(v * fade))
        sprite = sprite.copy()
        sprite.putalpha(alpha)
    layer.alpha_composite(sprite, (int(px) - 2, int(py) - 2))
    img.alpha_composite(layer)
    return np.asarray(img.convert("RGB"))


# --- Music: Bach, Prelude in C major (BWV 846), bars 1-19, each bar's five notes in the prelude's pattern.
BARS = [
    "C4 E4 G4 C5 E5", "C4 D4 A4 D5 F5", "B3 D4 G4 D5 F5", "C4 E4 G4 C5 E5",
    "C4 E4 A4 E5 A5", "C4 D4 F#4 A4 D5", "B3 D4 G4 D5 G5", "B3 C4 E4 G4 C5",
    "A3 C4 E4 G4 C5", "D3 A3 D4 F#4 C5", "G3 B3 D4 G4 B4", "G3 A#3 E4 G4 C#5",
    "F3 A3 D4 A4 D5", "F3 G#3 D4 F4 B4", "E3 G3 C4 G4 C5", "E3 F3 A3 C4 F4",
    "D3 F3 A3 C4 F4", "G2 D3 G3 B3 F4", "C3 E3 G3 C4 E4",
]
NAMES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def freq(note):
    name, octave = note[:-1], int(note[-1])
    midi = 12 * (octave + 1) + NAMES[name]
    return 440.0 * 2 ** ((midi - 69) / 12)


def piano(f, dur, sr):
    """A soft piano-like tone: a few harmonics, quick attack, long decay."""
    t = np.arange(int(dur * sr)) / sr
    tone = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (1.2 + 0.9 * h)) for h, a in [(1, 1.0), (2, 0.45), (3, 0.22), (4, 0.1), (5, 0.05)])
    attack = np.minimum(1.0, t / 0.008)
    return tone * attack


def music(seconds, path, sr=44100, sixteenth=0.27):
    out = np.zeros(int((seconds + 4) * sr))
    pos, bar = 0.0, 0
    while pos < seconds:
        notes = [freq(n) for n in BARS[bar % len(BARS)].split()]
        pattern = [0, 1, 2, 3, 4, 2, 3, 4] * 2
        for j, idx in enumerate(pattern):
            start = pos + j * sixteenth
            # The first two notes of each half bar ring on, like the held notes in the score.
            dur = 2.2 if j % 8 < 2 else 1.4
            tone = piano(notes[idx], dur, sr) * (0.9 if j % 8 else 1.0)
            a = int(start * sr)
            seg = out[a : a + len(tone)]
            seg += tone[: len(seg)]
        pos += 16 * sixteenth
        bar += 1
    out = out[: int(seconds * sr)]
    out /= np.max(np.abs(out)) + 1e-9
    # Quiet under the picture, in and out gently.
    env = np.ones_like(out)
    fi, fo = int(2.5 * sr), int(4 * sr)
    env[:fi] = np.linspace(0, 1, fi)
    env[-fo:] = np.linspace(1, 0, fo)
    out = out * env * 0.32
    pcm = (out * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def main(src, dst, clicks_file=None):
    global CLICKS
    if clicks_file:
        import json

        CLICKS = sorted((c[0], c[1], c[2]) for c in json.load(open(clicks_file)))
    seconds = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).decode())
    wav = dst + ".music.wav"
    music(seconds, wav)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        [
            "ffmpeg", "-v", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
            "-i", wav,
            # A little room around the piano, then gentle so it never competes with reading.
            "-filter:a", "aecho=0.8:0.6:60|120:0.25|0.15,volume=0.9",
            "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "450k", "-bufsize", "900k", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "64k", "-ac", "1",
            "-movflags", "+faststart", "-shortest", dst,
        ],
        stdin=subprocess.PIPE,
    )
    size = W * H * 3
    n = 0
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        spec = overlay_at(n / FPS)
        if spec:
            frame = draw(frame, spec)
        enc.stdin.write(frame.tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print("frames", n)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
