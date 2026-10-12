#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Generate KAWA's breakbeats: firmware/gen/kawa_breaks.h.

Every sound here is synthesised (no sample from a record): kick, snare, hats, ride and shaker are
made from sines and noise, then played in classic break rhythms (one bar, 16 steps, 160 BPM), with
a little swing, a small room and a tape-like saturation. Out comes one bar per break at 22050 Hz,
stored as 8-bit mu-law (the grain is part of the sound).

  python3 tools/gen_breaks.py            (needs numpy; the header is committed, so the build does not)
  python3 tools/gen_breaks.py --wav DIR  (also writes each break as a WAV, to listen)
"""
import argparse
import wave
from pathlib import Path

import numpy as np

SR = 22050
BPM = 160
STEPS = 16
STEP = SR * 60.0 / BPM / 4.0            # samples per 16th
BAR = int(round(STEP * STEPS))          # 33075
OUT = Path(__file__).resolve().parents[1] / "firmware" / "gen" / "kawa_breaks.h"
rng = np.random.default_rng(1977)


def t_of(dur):
    return np.arange(int(dur * SR)) / SR


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s
        y[i] = s
    return y


def onepole_hp(x, fc):
    return x - onepole_lp(x, fc)


def kick(v, tune=1.0, dur=0.38):
    t = t_of(dur)
    f = (46 + 115 * np.exp(-t / 0.032) + 260 * np.exp(-t / 0.004)) * tune
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.17) * (1 - np.exp(-t / 0.0007))
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.0014) * 0.35
    return np.tanh(2.2 * (body + onepole_hp(click, 1500))) * v


def snare(v, dur=0.32):
    t = t_of(dur)
    tone = np.sin(2 * np.pi * 186 * t) * np.exp(-t / 0.055) * 0.55 + np.sin(2 * np.pi * 332 * t) * np.exp(-t / 0.035) * 0.3
    n = rng.standard_normal(len(t))
    n = onepole_lp(onepole_hp(n, 1100), 7500) * np.exp(-t / 0.105) * 1.25
    return np.tanh(1.8 * (tone + n)) * v


def hat(v, open_=False):
    t = t_of(0.45 if open_ else 0.09)
    n = onepole_hp(onepole_hp(rng.standard_normal(len(t)), 5500), 5500)
    return n * np.exp(-t / (0.16 if open_ else 0.02)) * 0.55 * v


def ride(v):
    t = t_of(0.9)
    sq = sum(np.sign(np.sin(2 * np.pi * f * t + p)) for f, p in
             ((410.6, 0.1), (739.2, 1.3), (608.8, 2.2), (1045.4, 0.7), (1080.0, 2.9), (1600.0, 1.7)))
    sq = onepole_hp(onepole_hp(sq / 6.0, 4200), 4200)
    ping = np.sin(2 * np.pi * 3150 * t) * np.exp(-t / 0.012) * 0.2
    return (sq * np.exp(-t / 0.42) * 0.5 + ping) * v


def shaker(v):
    t = t_of(0.07)
    n = onepole_hp(rng.standard_normal(len(t)), 6500)
    return n * (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.025) * 0.35 * v


def room(x, mix=0.12):
    """a small Schroeder room: four combs, two all-passes"""
    out = np.zeros_like(x)
    for d, g in ((1116, 0.70), (1188, 0.68), (1277, 0.66), (1356, 0.64)):
        d = int(d * SR / 44100)
        buf = np.zeros(d)
        y = np.empty_like(x)
        k = 0
        for i, v in enumerate(x):
            o = buf[k]
            buf[k] = v + o * g
            y[i] = o
            k = (k + 1) % d
        out += y
    for d, g in ((556, 0.5), (441, 0.5)):
        d = int(d * SR / 44100)
        buf = np.zeros(d)
        y = np.empty_like(out)
        k = 0
        for i, v in enumerate(out):
            o = buf[k]
            buf[k] = v + o * g
            y[i] = o - v * g
            k = (k + 1) % d
        out = y
    return x + out * mix * 0.25


# The rhythms: (step, sound, velocity[, nudge in 1/32 of a step]). K kick, S snare, H hat, O open hat,
# R ride, Z shaker. Tags per slice for the screen: 1 kick, 2 snare, 4 hat or cymbal.
BREAKS = [
    ("AMENE", 0.05, [  # the most chopped break there is, as a rhythm
        *[(s, "R", 0.55 if s % 4 == 0 else 0.42) for s in range(0, 16, 2)],
        (0, "K", 1.0), (2, "K", 0.9), (10, "K", 0.95), (11, "K", 0.8),
        (4, "S", 1.0), (7, "S", 0.45), (9, "S", 0.55), (12, "S", 1.0), (15, "S", 0.5),
    ]),
    ("PENSE", 0.08, [  # think-like: busy hats, kicks off the beat
        *[(s, "H", 0.55 if s % 2 == 0 else 0.3) for s in range(16) if s != 14],
        (14, "O", 0.6),
        (0, "K", 1.0), (6, "K", 0.85), (10, "K", 0.95), (13, "K", 0.7),
        (4, "S", 1.0), (12, "S", 1.0), (7, "S", 0.32), (9, "S", 0.3), (15, "S", 0.42),
    ]),
    ("FUNKY", 0.10, [  # funky-drummer-like: open hats, ghost notes, swing
        *[(s, "H", 0.5 if s % 2 == 0 else 0.28) for s in range(16) if s not in (7, 15)],
        (7, "O", 0.55), (15, "O", 0.5),
        (0, "K", 1.0), (2, "K", 0.85), (6, "K", 0.75), (10, "K", 0.95), (13, "K", 0.8),
        (4, "S", 1.0), (9, "S", 0.38), (12, "S", 1.0), (14, "S", 0.4),
    ]),
    ("ECLAIR", 0.02, [  # a jungle two-step with a snare roll at the end
        *[(s, "Z", 0.6 if s % 2 else 0.35) for s in range(16)],
        *[(s, "H", 0.45) for s in range(0, 16, 2)],
        (0, "K", 1.0), (10, "K", 1.0), (7, "K", 0.6),
        (4, "S", 1.0), (12, "S", 1.0), (14, "S", 0.55), (15, "S", 0.6), (15, "S", 0.5, 16),
    ]),
]
SOUND = {"K": kick, "S": snare, "H": lambda v: hat(v), "O": lambda v: hat(v, True), "R": ride, "Z": shaker}
TAG = {"K": 1, "S": 2, "H": 4, "O": 4, "R": 4, "Z": 0}


def render(swing, events):
    bar = np.zeros(BAR + SR)
    tags = [0] * STEPS
    for ev in events:
        step, snd, vel = ev[:3]
        nudge = ev[3] if len(ev) > 3 else 0
        pos = step * STEP + (STEP * swing if step % 2 else 0) + STEP * nudge / 32.0
        x = SOUND[snd](vel)
        p = int(pos)
        bar[p:p + len(x)] += x
        if vel > 0.4:
            tags[step] |= TAG[snd]
    tail = bar[BAR:]
    bar = bar[:BAR].copy()
    bar[:len(tail)] += tail[:BAR]                 # the tails of the last steps ring into the first: it loops
    bar = room(bar)
    bar = onepole_lp(bar, 8200)                   # a record's top end
    bar = np.tanh(1.5 * bar / np.max(np.abs(bar))) / np.tanh(1.5)
    return bar * 0.94, tags


def mulaw_encode(x):
    mu = 255.0
    y = np.sign(x) * np.log1p(mu * np.abs(x)) / np.log1p(mu)
    return np.clip(np.round((y + 1) * 127.5), 0, 255).astype(np.uint8)


def mulaw_table():
    mu = 255.0
    c = np.arange(256) / 127.5 - 1
    x = np.sign(c) * (np.power(1 + mu, np.abs(c)) - 1) / mu
    return np.clip(np.round(x * 32767), -32767, 32767).astype(int)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", type=Path)
    a = ap.parse_args()
    lines = ["/* generated by tools/gen_breaks.py: synthesised breakbeats (no samples from records), GPL-3.0-only */",
             "#pragma once", "#include <stdint.h>",
             f"#define BRK_N {len(BREAKS)}u", f"#define BRK_LEN {BAR}u            /* one bar, 22050 Hz */",
             f"#define BRK_BPM {BPM}u", f"#define BRK_SR {SR}u"]
    tab = mulaw_table()
    lines.append("static const int16_t BRK_ULAW[256] = {" + ", ".join(map(str, tab)) + "};")
    names, tagrows, datas = [], [], []
    for name, swing, ev in BREAKS:
        bar, tags = render(swing, ev)
        code = mulaw_encode(bar)
        names.append(f'"{name}"')
        tagrows.append("{" + ", ".join(map(str, tags)) + "}")
        rows = [", ".join(map(str, code[i:i + 40])) for i in range(0, len(code), 40)]
        datas.append("{\n" + ",\n".join(rows) + "}")
        if a.wav:
            a.wav.mkdir(parents=True, exist_ok=True)
            with wave.open(str(a.wav / f"{name.lower()}.wav"), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(SR)
                dec = tab[code].astype(np.int16)
                w.writeframes(np.tile(dec, 4).tobytes())
        print(f"{name}: {len(code)} samples, tags {tags}")
    lines.append("static const char *const BRK_NAME[BRK_N] = {" + ", ".join(names) + "};")
    lines.append("static const uint8_t BRK_TAG[BRK_N][16] = {" + ", ".join(tagrows) + "};   /* 1 kick 2 snare 4 hat */")
    lines.append("static const uint8_t BRK_DATA[BRK_N][BRK_LEN] = {" + ",\n".join(datas) + "};")
    OUT.write_text("\n".join(lines) + "\n")
    print("->", OUT)


if __name__ == "__main__":
    main()
