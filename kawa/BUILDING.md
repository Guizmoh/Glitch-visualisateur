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
  checks their SHA-256 values and stops if one differs.

```sh
./build.sh                  # -> build/kawa.fwsc, identity FM-1_950
./build.sh --release 0.2    # -> build/kawa-0.2.fwsc, identity FM-1_952, version "0.2" on the screen
```

`JIELI_TOOLCHAIN` and `AC79_SDK` override the default locations. The build fails on what would brick or
break an FM-1 firmware: an image, RAM or pool that is too big, a call into the chip ROM, a register touched
outside `hal/`, or a call from code that runs while the flash is busy. It also checks the flash map: the app
area ends at or below `0x93000` (all that the update loader writes), the store stays inside `0x97000..0xE0000`,
clear of the update staging `0xE0000..0xE5000` and the settings `0xFC000`, the app cannot write the flash head
or its own code, the loader cannot write the head, the store or the settings, and the loader's `ota.bin` stays
within 19456 bytes (the most the stock firmware stages, for a first install from it). A release `X.Y` is
`FM-1_95Y` for 0.Y and `FM-1_96Y` for 1.Y; a major 2 is refused until there is a new scheme. The chip has no
FPU, so the code uses integers only and no 64-bit division. See Dinghy's `docs/RULES.md` for the details.

The update loader (`firmware/loader/`, Felucca's) reads the package's whole `flash.bin` once and checks it
against the package's CRC16 before it erases anything, so a damaged or cut package leaves the old firmware
as it is. On that pass it keeps two CRC16s of every app sector (two polynomials: 32 bits). Then it writes
the app area `0x4000..0x93000` only, sector by sector; a sector that comes in different from the checked
pass is read again, never written, and every written sector is read back and compared. Until the host says "success" the update
record stays: after a power cut or a lost cable the FM-1 starts in the loader again and the host can resume.
On an unknown flash chip it writes nothing and the old firmware starts again. After `./build.sh`,
`tests/run_loader_tests.sh` runs both steps of an update on a computer against the package (it needs
`AC79_SDK` too).

## Safety: rescue, and back to the official firmware

- **Rescue.** Hold OCT- while switching on, or let KAWA fail to start twice within 30 s: the screen shows
  `KAWA USB RESCUE`. Audio, projects and the editor stay off; only USB and the same checked updater run, so
  a package can be installed from there (`tools/fm1_install.py`, or M-UPGRADE for the official firmware).
- **A cut install.** The update record stays until the host says "success": switched on again, the FM-1
  starts in the loader (`ota-FM-1_900`) and `tools/fm1_install.py` finishes the write.
- **Back to the official firmware.** M-UPGRADE with the official V15 package (identity `FM-1_015`, SHA-256
  `db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a`). KAWA hands over to the official
  updater only if it is M-VAVE's own loader (its CRCs are known, `firmware/src/ota.c`) and only if the
  package's flash head `0..0x4000` is byte for byte the one already on this FM-1: the official loader
  rewrites the head, so it can only write back the same bytes. If either check fails, nothing is written
  and KAWA keeps running. This step is the riskiest one (the official loader is not ours): a stable power
  supply, a data cable, and no unplugging while it runs. The KAWA projects and samples are not kept.
- **Not proven.** The chip's mask-ROM USB mode (WL80UBOOT, the FM-1 Transporter) is documented by
  [fm-1-re](https://github.com/al-255/fm-1-re) but not tested here; KAWA never relies on it.

## Generated files

| File | Made by | |
| --- | --- | --- |
| `firmware/gen/kawa_art.h` | `tools/gen_art.py` | icons 8 x 8 and the mascot 16 x 16, drawn as text |
| `firmware/gen/kawa_breaks.h` | `tools/gen_breaks.py` | six breaks, synthesised, 22050 Hz, 8-bit mu-law (needs numpy; `--wav DIR` to listen; `tests/breaks_check.py` checks them) |
| `firmware/gen/kawa_tables.h` | `tools/gen_tables.py` | fixed-point tables: pitch, envelopes, filters, the 4-bit waves |
| `firmware/gen/felucca_font.h` | Dinghy | Terminus 8 x 16 (SIL OFL 1.1) |

## Memory and flash

The 0.2 build uses an image of about 359 KB of the 568 KB available, 43 KB of the 96 KB of RAM and 292 KB
of the 336 KB pool (the effects' capture, the echo, the project and the screen bands). Projects are kept in
four 36 KB slots from `0x97000` (slot 0 is the autosave) and the user samples in four 37 KB slots from
`0xBB000` up to `0xE0000`: the store is `0x97000..0xE0000`, the part of the flash an update never erases.
The language is kept in the settings sector `0xFC000`. Flash is only erased when nothing plays, because an
erase stalls the sound.
