# Licensing

KAWA is free software under the GNU General Public License, version 3 only (`GPL-3.0-only`, full text in
`LICENSE`). You may use, study, change and share it. If you give someone a firmware built from it, give
them its complete source under the same licence too.

*En bref : KAWA est un logiciel libre sous GPL-3.0. Tu peux l'utiliser, l'étudier, le modifier et le
partager ; si tu donnes un firmware construit à partir de lui, donne aussi son code source.*
*En resumen: KAWA es software libre bajo GPL-3.0. Puedes usarlo, estudiarlo, cambiarlo y compartirlo; si
das un firmware construido a partir de él, da también su código fuente.*

## Who made what

| | |
| --- | --- |
| KAWA: `firmware/src/kawa*.c`, `firmware/gen/kawa_*.h`, `tools/gen_*.py`, `tests/`, `web/`, `emulateur/`, the docs | Omnipotard |
| The platform: `firmware/hal/`, `firmware/loader/`, `crt0.S`, `app.ld`, `firmware/src/` (`usb.c`, `ota.c`, `recovery.c`, `lcd.c`, `gfx.c`, `libc.c`, `bootguard.h`, `uac_fir.h`), `tools/build.py`, `tools/fm1_install.py`, `tools/fm1pkg_make.py`, `tools/lz4blk.py`, `tools/get_toolchain.sh` | Copyright (C) 2026 Leo Kuroshita (@kurogedelic), Hügelton Instruments ([Felucca](https://github.com/hugelton/Felucca)), with the changes of [SLOOP](https://github.com/isod89/sloop-fm1) (isod89) |
| The wiring `firmware/src/platform.c` and the host mode that `tests/host.c` started from | zvenson ([Dinghy](https://github.com/zvenson/dinghy)) |

KAWA changes the platform in two places: `platform.c` widens the flash range it may write to the project
slots (`STORE_LO` to `STORE_HI`) and includes `web/wasm_host.c` for the browser build. `tools/build.py`
builds `kawa.c` under KAWA's package identity (`FM-1_95N`).

## Sounds

Every sound of KAWA is synthesised. The four breaks are made by `tools/gen_breaks.py` from sines and noise
and played in classic break rhythms; no recording is used. The drums, waves and noise are generated live
by the firmware.

## Third-party material

| What | Licence | Where |
| --- | --- | --- |
| Terminus font 8x16 (ter-u16n), rendered into `firmware/gen/felucca_font.h` | SIL OFL 1.1 | `assets/fonts/Terminus-LICENSE.txt` |
| JieLi AC79 SDK: `uboot.boot`, `cfg_tool.bin`, `eq_cfg_hw.bin` are read from your SDK checkout at build time and placed in the package; no SDK files are in this tree | Apache-2.0 | <https://gitee.com/Jieli-Tech/fw-AC79_AIoT_SDK> |
| Fonts of the emulator page (Silkscreen, Atkinson Hyperlegible, IBM Plex Mono), loaded from Google Fonts | SIL OFL 1.1 | not in this tree |

## Trademarks

"Felucca" and "Hügelton Instruments" are names of Hügelton Instruments; "M-VAVE" and "FM-1" belong to their
owners. KAWA is not made or endorsed by them.
