# Building KAWA

[README](README.md) · [Français](README.fr.md) · [Español](README.es.md)

## On a computer, no FM-1: the simulator

```sh
tests/run_host.sh                    # tests/tour.txt: the demo, every page, live effects
tests/run_host.sh tests/edit.txt     # step entry, the chopper, undo, the grid, saving
tests/run_host.sh tests/docs-en.txt  # the screens of the docs (docs-fr.txt, docs-es.txt)
```

It compiles `firmware/src/kawa.c` with `tests/host.c` (a fake FM-1) using the system C compiler. It writes
`build/host/kawa.wav` and the screens as PNG (Python 3 with Pillow). In a script, each line is
`T keys MASK`, `T press ID`, `T release ID`, `T btn ID`, `T enc ID STEPS`, `T lang L`, `T shot NAME` or
`T end`, where T is in milliseconds. See `tests/host.c` for the button and knob ids.

## In a browser: the emulator

```sh
web/make_emulator.sh                 # -> emulateur/index.html (and build/web/)
```

This needs clang with the wasm32 target and wasm-ld (`lld`). No libc and no Emscripten are needed.
`web/wasm_host.c` is the FM-1 for the browser and `web/emulator.html` is the page. The wasm module is
embedded in the page, so `emulateur/index.html` stands alone.

## For the FM-1: the package

- Linux x86-64, or macOS / Windows with Docker or WSL.
- Python 3 with Pillow.
- The JieLi toolchain (clang for pi32v2): `tools/get_toolchain.sh` installs it to `~/.jieli/toolchain`.
- Three files of the JieLi AC79 SDK (Apache-2.0), at their tested version:

  ```sh
  git clone --depth 1 --branch AC79NN_SDK_V1.2.1_2023-12-13 \
      https://gitee.com/Jieli-Tech/fw-AC79_AIoT_SDK.git ~/fw-AC79_AIoT_SDK
  ```

  Only `cpu/wl82/tools/uboot.boot`, `cfg_tool.bin` and `cfg/eq_cfg_hw.bin` are used. `tools/build.py`
  checks their SHA-256 values.

```sh
./build.sh                  # -> build/kawa.fwsc, identity FM-1_950
./build.sh --release 0.1    # -> build/kawa-0.1.fwsc, identity FM-1_951, version "0.1" on the screen
```

`JIELI_TOOLCHAIN` and `AC79_SDK` override the default locations. The build fails on what would brick or
break an FM-1 firmware: an image, RAM or pool that is too big, a call into the chip ROM, a register touched
outside `hal/`, or a call from code that runs while the flash is busy. The chip has no FPU, so the code uses
integers only and no 64-bit division. See Dinghy's `docs/RULES.md` for the details.

## Generated files

| File | Made by | |
| --- | --- | --- |
| `firmware/gen/kawa_art.h` | `tools/gen_art.py` | icons 8 x 8 and the mascot 16 x 16, drawn as text |
| `firmware/gen/kawa_breaks.h` | `tools/gen_breaks.py` | four breaks, synthesised, 22050 Hz, 8-bit mu-law (needs numpy; `--wav DIR` to listen) |
| `firmware/gen/kawa_tables.h` | `tools/gen_tables.py` | fixed-point tables: pitch, envelopes, filters, the 4-bit waves |
| `firmware/gen/felucca_font.h` | Dinghy | Terminus 8 x 16 (SIL OFL 1.1) |

## Memory and flash

The 0.1 build uses an image of about 234 KB of the 568 KB available, 20 KB of the 96 KB of RAM and 292 KB
of the 336 KB pool (the effects' capture, the echo, the project and the screen bands). Projects are 26 KB
each and are kept in five 28 KB slots from `0x97000` (slot 0 is the autosave). The language is kept in the
settings sector `0xFC000`. Flash is only erased when nothing plays, because an erase stalls the sound.
