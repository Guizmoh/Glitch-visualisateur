#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""KAWA's pixel art, drawn here as text: firmware/gen/kawa_art.h.

  python3 tools/gen_art.py

Icons are 8 x 8 ('#' lit), drawn by the firmware in one colour at 1x or 2x.
The dog (the boot screen 48 x 48, the mascot 16 x 16) has 16 inks (INKS below), drawn with a palette:
the headband and the cups take the colour of what is going on.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "firmware" / "gen" / "kawa_art.h"

ICONS = {
    # the six tracks
    "PULSE": ["........", ".###..##", ".#.#..#.", ".#.#..#.", ".#.#..#.", ".#.#..#.", "##.####.", "........"],
    "WAVE": ["........", "...#....", "..#.#...", ".#...#..", "#.....#.", ".......#", "........", "........"],
    "NOISE": ["........", ".#...#..", ".##.##.#", "#.#.#.##", "#.##.#.#", "#..#...#", "...#....", "........"],
    "KIT": ["........", ".######.", "#......#", "########", "#.#..#.#", "#......#", ".######.", "........"],
    "BREAK": ["....##..", "...##...", "..##....", ".######.", "....##..", "...##...", "..##....", ".##....."],
    # the cell tricks (FX column)
    "ARP": ["........", "......##", "......#.", "....###.", "....#...", "..###...", "..#.....", "###....."],
    "GLIDE": ["........", ".......#", "......#.", ".....#..", "...##...", ".##.....", "#.......", "........"],
    "VIB": ["........", "........", ".#...#..", "#.#.#.#.", "...#...#", "........", "........", "........"],
    "ROLL": ["........", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "........"],
    "BEND": ["....#...", "...###..", "..#.#.#.", "....#...", "...#....", "..#.....", "##......", "........"],
    "DICE": [".######.", "#......#", "#.#..#.#", "#......#", "#.#..#.#", "#......#", ".######.", "........"],
    "CLOCK": ["..####..", ".#....#.", "#...#..#", "#...#..#", "#...##.#", "#......#", ".#....#.", "..####.."],
    "CUT": ["#.....#.", ".#...#..", "..#.#...", "...#....", "..#.#...", ".##.##..", "#..#..#.", ".##..##."],
    "REV": ["........", "...#...#", "..##..##", ".###.###", "..##..##", "...#...#", "........", "........"],
    "SHARP": ["..#..#..", "..#..#..", ".######.", "..#..#..", "..#..#..", ".######.", "..#..#..", "..#..#.."],
    "SHAPE": ["........", ".###....", ".#.#....", ".#.#....", ".#.#....", "##.#####", "........", "........"],
    "CRUSH": ["........", "......##", "......##", "....####", "....####", "..######", "..######", "########"],
    # live effects
    "LOOP": ["..####..", ".#....#.", "#......#", "#......#", "#..#...#", ".#.##.#.", "..####..", "...#...."],
    "UNI": ["........", ".##.##..", "#..#..#.", "#..#..#.", "#..#..#.", ".##.##..", "........", "........"],
    "UP": ["...#....", "..###...", ".#.#.#..", "...#....", "...#....", "...#....", "...#....", "........"],
    "DOWN": ["...#....", "...#....", "...#....", "...#....", ".#.#.#..", "..###...", "...#....", "........"],
    "STUT": ["........", "#.#.#.#.", "#.#.#...", "#.#.#...", "#.#.....", "#.#.....", "#.......", "........"],
    "DISC": ["..####..", ".#....#.", "#..##..#", "#.#..#.#", "#.#..#.#", "#..##..#", ".#....#.", "..####.."],
    "TRI3": ["........", "........", "#..#..#.", "#..#..#.", "........", "#..#..#.", "........", "........"],
    "AGAIN": ["..###.#.", ".#...##.", "#...###.", "#.......", "#......#", ".#....#.", "..####..", "........"],
    "ACCEL": ["........", "#..#.#.#", "#..#.#.#", "#..#.#.#", "#..#.#.#", "#..#.#.#", "#..#.#.#", "........"],
    "PIXEL": ["##..##..", "##..##..", "..##..##", "..##..##", "##..##..", "##..##..", "..##..##", "..##..##"],
    "LPF": ["........", "####....", "....#...", ".....#..", "......#.", "......#.", ".......#", "........"],
    "HPF": ["........", "....####", "...#....", "..#.....", ".#......", ".#......", "#.......", "........"],
    "TAPE": ["........", "########", "#......#", "#.#..#.#", "#......#", "#.####.#", "########", "........"],
    "DIVE": ["#.......", ".#......", "..#.....", "...#....", "....#..#", ".....#.#", "......##", "....####"],
    "GATE": ["........", "##.##.##", "##.##.##", "##.##.##", "##.##.##", "##.##.##", "........", "........"],
    "SNOW": ["...#....", ".#.#.#..", "..###...", "#######.", "..###...", ".#.#.#..", "...#....", "........"],
    "RING": ["..####..", ".#....#.", "#..##..#", "#.#..#.#", "#..##..#", ".#....#.", "..####..", "........"],
    "ECHO": ["........", "#.......", "#.#.....", "#.#.#...", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "........"],
    "DIST": ["........", ".####...", "#....#..", "......#.", ".......#", "......#.", "#....#..", ".####..."],
    "WOB": ["........", "#......#", ".#....#.", "..#..#..", "..#..#..", ".#....#.", "#......#", "........"],
    "NOMEL": ["#....#..", ".#...##.", "..#..#.#", "...#.#..", "..###...", ".####.#.", ".###...#", "........"],
    "NOBEAT": ["#......#", ".######.", "#.#..#.#", "########", "#.#..#.#", "#..##..#", ".######.", "#......#"],
    # the magic tools
    "KNIFE": ["......##", ".....###", "....###.", "...###..", "..###...", ".#.#....", "#.#.....", ".#......"],
    "NOTE": ["...###..", "...#.##.", "...#....", "...#....", ".###....", "####....", ".##.....", "........"],
    "BASS": ["........", "...#....", "...#....", "...#....", ".###....", "####....", ".##.....", "########"],
    "EUCL": ["..#..#..", ".......#", "#.......", "........", "#......#", "........", ".#....#.", "...##..."],
    "VOL": ["........", "......#.", "....#.#.", "..#.#.#.", "#.#.#.#.", "#.#.#.#.", "#.#.#.#.", "........"],
    "X2": ["........", "#...#...", ".#.#....", "..#..##.", ".#.#...#", "#...#.#.", "....####", "........"],
    "RIGHT": ["........", "....#...", "....##..", "#######.", "....##..", "....#...", "........", "........"],
    "MIRROR": ["...#....", ".#.#.#..", "##.#.##.", "##.#.##.", "##.#.##.", ".#.#.#..", "...#....", "........"],
    "UPDN": ["...#....", "..###...", ".#.#.#..", "...#....", ".#.#.#..", "..###...", "...#....", "........"],
    "COPY": ["####....", "#..#....", "#.####..", "#.#..#..", "###..#..", "..#..#..", "..####..", "........"],
    "PASTE": ["..##....", "######..", "#....#..", "#.##.#..", "#....#..", "#.##.#..", "######..", "........"],
    "ERASE": ["........", "#.....#.", ".#...#..", "..#.#...", "...#....", "..#.#...", ".#...#..", "#.....#."],
    # engines, envelope, LFO, routing
    "FM": ["........", ".##..##.", "#..##..#", "#..##..#", "........", ".##..##.", "#..##..#", "........"],
    "SAMPLE": ["........", "...#....", "..##.#..", ".###.##.", "#######.", ".###.##.", "..##.#..", "...#...."],
    "ENV": ["........", "...#....", "..#.#...", "..#..##.", ".#.....#", ".#.....#", "#......#", "........"],
    "LFO": ["........", ".##.....", "#..#....", "#..#...#", "....#..#", "....#..#", ".....##.", "........"],
    "BPF": ["........", "...##...", "..#..#..", "..#..#..", ".#....#.", ".#....#.", "#......#", "........"],
    "TREM": ["........", "#.......", "##.#....", "####.#..", "########", "####.#..", "##.#....", "#......."],
    "VERB": ["..####..", ".#....#.", "#..##..#", "#.#..#.#", "#..##..#", ".#....#.", "..####..", "........"],
    "CLONE": ["####....", "#..#....", "#.####..", "#.#..#..", "###..#..", "..####..", "........", "........"],
    "THEME": ["..###...", ".#...#..", "#.#.#.#.", "#.....#.", "#.##..#.", ".#...#..", "..###...", "........"],
    "TARGET": ["...#....", ".#####..", "#.....#.", "#..#..#.", "#.....#.", ".#####..", "...#....", "........"],
    # small signs
    "PLAY": ["#.......", "##......", "###.....", "####....", "###.....", "##......", "#.......", "........"],
    "STOP": ["........", "######..", "######..", "######..", "######..", "######..", "........", "........"],
    "REC": ["........", "..###...", ".#####..", ".#####..", ".#####..", "..###...", "........", "........"],
    "CHAIN": ["........", "........", ".##..##.", "#..##..#", "#..##..#", ".##..##.", "........", "........"],
    "LOCK": ["..###...", ".#...#..", ".#...#..", "#######.", "###.###.", "###.###.", "#######.", "........"],
    "MUTE": ["...#....", "..##..#.", "####.#..", "####..#.", "####.#.#", "..##....", "...#....", "........"],
    "BETA": [".###....", "#...#...", "#..#....", "####....", "#...#...", "#...#...", "####....", "#......."],
}

# KAWA's dog: a Czechoslovakian wolfdog with headphones. 4 bits a pixel, inks:
INKS = ".kDGLWENPTHCcSRz"   # clear, outline, dark / mid / light fur, white, amber eye, nose, pupil, tongue,
#                            headband (accent), cups, cups' rim, highlight, inner ear, extra
DOG48 = [
    ".........k............................k.........",
    "........kGk..........................kGk........",
    ".......kGGGk........................kGGGk.......",
    ".......kGGGGk........kkkkkk........kGGGGk.......",
    ".......kGLGGGk...kkkkHHHHHHkkkk...kGGGLGk.......",
    ".......kGLLGGGkkkHHHHHHHHHHHHHHkkkGGGLLGk.......",
    "......kGGLLLGGGHHHHHHHkkkkHHHHHHHGGGLLLGGk......",
    "......kGGLLLLGHHHHkkkkkkkkkkkkHHHHGLLLLGGk......",
    "......kGGLRLHHHHGkkkkDDDDDDkkkkGHHHHLRLGGk......",
    "......kGGLRHHHHGGDDDDDDDDDDDDDDGGHHHHRLGGk......",
    ".....kGGGLHHHLLGDDDDDDDDDDDDDDDDGLLHHHLGGGk.....",
    ".....kGGLRHHRGGDDDDDDDDDDDDDDDDDDGGRHHRLGGk.....",
    ".....kGGLHHHGGDDDDDDDDDDDDDDDDDDDDGGHHHLGGk.....",
    ".....kGGHHHGGDDDDDDDDDDDDDDDDDDDDDDGGHHHGGk.....",
    "....kGGGHHGGGGDDDDDDDDDDDDDDDDDDDDGGGGHHGGGk....",
    "....kGGHHHGGGGGDDDDDDDDDDDDDDDDDDGGGGGHHHGGk....",
    "....kGCCHGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGHCCGk....",
    "....kCCCCGGGGGGGLLLDDDDDDDDDDLLLGGGGGGGCCCCk....",
    "...kCCccCCGGGGGLLLLLDDDDDDDDLLLLLGGGGGCCccCCk...",
    "..kCCcSccCCGGGGGLLLDDDDDDDDDDLLLGGGGGCCcccSCCk..",
    "..kCCccccCCGkkkkGGGGGDDDDDDGGGGGkkkkGCCccccCCk..",
    "..kCCcHHcCCkESEEkkGGGDDDDDDGGGkkESEEkCCcHHcCCk..",
    "..kCccHHccCWkEPPEEkGGGDDDDGGGkEEPPEkWCccHHccCk..",
    "..kCccHHccCWWkEPEEEkGGDDDDGGkEEEPEkWWCccHHccCk..",
    "..kCCcHHcCCWWWkkkkkGGGDDDDGGGkkkkkWWWCCcHHcCCk..",
    "..kCCccccCCWWWWWWGGGGGGGGGGGGGGWWWWWWCCccccCCk..",
    "..kCCccccCCWWWWWWWGGGGGGGGGGGGWWWWWWWCCccccCCk..",
    "...kCCccCCWWWWWWWWWGGLGGGGLGGWWWWWWWWWCCccCCk...",
    "....kCCCCWWWWWWWWWWWGLGGGGLGWWWWWWWWWWWCCCCk....",
    ".....kCCkkWWWWWWWWWWLLNNNNLLWWWWWWWWWWkkCCk.....",
    "......kk..kWWWWWWWWWLNNSNNNLWWWWWWWWWk..kk......",
    "...........kWWWWWWWWLNNNNNNLWWWWWWWWk...........",
    "............kWWWWWWGLLNNNNLLGWWWWWWk............",
    ".............kWWWWWLLLLLNLLLLWWWWWk.............",
    "............kGGGGWWLLNLLNLLNLWWGGGGk............",
    "...........kGGGGGGGLLLNNLNNLLGGGGGGGk...........",
    "..........kGGGGGGGGWWWWWWWWWWGGGGGGGGk..........",
    ".........kGGGGGGGGGWWWTTTTWWWGGGGGGGGGk.........",
    ".........kGGGGGGGGGGWWWTTWWWGGGGGGGGGGk.........",
    "........kGGGGGGGGGGGWWWWWWWWGGGGGGGGGGGk........",
    "........kGGGGGGLLWWGWWWWWWWWGWWLLGGGGGGk........",
    "........kGGGGLLLLWWWGWWWWWWGWWWLLLLGGGGk........",
    ".......kGGGGLLLLLWWWWWWWWWWWWWWLLLLLGGGGk.......",
    ".......kGGGGLLLLLWWWWWWWWWWWWWWLLLLLGGGGk.......",
    "......kGGGGGLLLLWWWWWWWWWWWWWWWWLLLLGGGGGk......",
    "......kGGGGLLLLLWWWWWWWWWWWWWWWWLLLLLGGGGk......",
    "......kGGGGLLLLLWWWWWWWWWWWWWWWWLLLLLGGGGk......",
    ".....kGGGGLLLLLLWWWWWWWWWWWWWWWWLLLLLLGGGGk.....",
]
DOG16 = {
    "IDLE": [
        "...k........k...",
        "..kGk.HHHH.kGk..",
        "..kGRkHHHHkRGk..",
        "..kGGGDDDDGGGk..",
        "CCkGDDDDDDDDGkCC",
        "CHGGLLDDDDLLGGHC",
        "CHGEPkDDDDkPEGHC",
        "CCGGGGGDDGGGGGCC",
        ".kWWGGGGGGGGWWk.",
        ".kWWWWGGGGWWWWk.",
        "..kWWWWNNWWWWk..",
        "...kWWWNNWWWk...",
        "....kWWTTWWk....",
        ".....kWWWWk.....",
        "......kkkk......",
        "................"
    ],
    "BLINK": [
        "...k........k...",
        "..kGk.HHHH.kGk..",
        "..kGRkHHHHkRGk..",
        "..kGGGDDDDGGGk..",
        "CCkGDDDDDDDDGkCC",
        "CHGGLLDDDDLLGGHC",
        "CHGkkkDDDDkkkGHC",
        "CCGGGGGDDGGGGGCC",
        ".kWWGGGGGGGGWWk.",
        ".kWWWWGGGGWWWWk.",
        "..kWWWWNNWWWWk..",
        "...kWWWNNWWWk...",
        "....kWWTTWWk....",
        ".....kWWWWk.....",
        "......kkkk......",
        "................"
    ],
    "WILD": [
        "...k........k...",
        "..kGk.HHHH.kGk..",
        "..kGRkHHHHkRGk..",
        "..kGGGDDDDGGGk..",
        "CCkGDDDDDDDDGkCC",
        "CHGLGLDDDDLGLGHC",
        "CHGEEkDDDDkEEGHC",
        "CCGGGGGDDGGGGGCC",
        ".kWWGGGGGGGGWWk.",
        ".kWWWWGGGGWWWWk.",
        "..kWWWWNNWWWWk..",
        "...kWWWNNWWWk...",
        "....kWTTTTWk....",
        ".....kTTTTk.....",
        "......kkkk......",
        "................"
    ],
    "SLEEP": [
        "...k........k.Sz",
        "..kGk.HHHH.kGk..",
        "..kGRkHHHHkRGk..",
        "..kGGGDDDDGGGk..",
        "CCkGDDDDDDDDGkCC",
        "CHGGLLDDDDLLGGHC",
        "CHGGkkDDDDkkGGHC",
        "CCGGGGGDDGGGGGCC",
        ".kWWGGGGGGGGWWk.",
        ".kWWWWGGGGWWWWk.",
        "..kWWWWNNWWWWk..",
        "...kWWWNNWWWk...",
        "....kWWTTWWk....",
        ".....kWWWWk.....",
        "......kkkk......",
        "................"
    ]
}


def main():
    names = list(ICONS)
    lines = ["/* generated by tools/gen_art.py: KAWA's icons (8 x 8) and the mascot (16 x 16, 2 bits) */",
             "#pragma once", "#include <stdint.h>",
             "enum { " + ", ".join(f"ICO_{n}" for n in names) + ", ICO_N };"]
    rows = []
    for n in names:
        img = ICONS[n]
        assert len(img) == 8 and all(len(r) == 8 for r in img), n
        rows.append("{" + ", ".join("0x%02X" % int(r.replace("#", "1").replace(".", "0"), 2) for r in img) + "}")
    lines.append("static const uint8_t ICONS[ICO_N][8] = {\n    " + ",\n    ".join(rows) + "};")
    def pack4(rows, w):
        out = []
        for r in rows:
            assert len(r) == w, r
            for x in range(0, w, 2):
                out.append(INKS.index(r[x]) | INKS.index(r[x + 1]) << 4)
        return out
    names16 = list(DOG16)
    lines.append("enum { " + ", ".join(f"DOG_{n}" for n in names16) + ", DOG_N };")
    lines.append("static const uint8_t DOG16[DOG_N][128] = {\n    " + ",\n    ".join(
        "{" + ", ".join(map(str, pack4(DOG16[n], 16))) + "}" for n in names16) + "};")
    lines.append("static const uint8_t DOG48[1152] = {" + ", ".join(map(str, pack4(DOG48, 48))) + "};")
    OUT.write_text("\n".join(lines) + "\n")
    print("->", OUT, len(names), "icons,", len(names16), "dog frames")


if __name__ == "__main__":
    main()
