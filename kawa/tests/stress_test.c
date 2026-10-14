/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA's audio at its limits, on this computer, under UBSan (tests/run_stress_test.sh): every factory sound with
 * every track effect at the ends of its knobs, every master effect, every live effect held over a loud song, the
 * kits at DECAY +8 and DRIVE 15, PULSE with DETUNE and UNISON, FM loud and panned, all faders up. The interrupt's
 * integers must never wrap (a wrap is a full-scale click on the FM-1): the sanitiser stops the run at the first
 * one and names the line. It also checks the output stays finite and the voices end. */
#define main kawa_host_main
#include "../firmware/src/kawa.c"
#undef main

#define BLK 256u
static int32_t out[2u * BLK];
static uint32_t blocks;
static int32_t peak_all;

static void render(uint32_t n)
{
    uint32_t b, i;
    for (b = 0; b < n; b++) {
        for (i = 0; i < 2u * BLK; i++)
            out[i] = 0;
        app_audio(out, BLK);
        for (i = 0; i < 2u * BLK; i++) {
            int32_t a = out[i] < 0 ? -out[i] : out[i];
            if (a > peak_all) peak_all = a;
        }
        blocks++;
    }
}

static void quiet_all(void)
{
    sq_req = 2;
    lfx_keys = 0;
    ev_push(EV_KILL, NTRK, 0, 0, 0, 0);
    render(40);
}

static void loud_faders(void)
{
    uint32_t t;
    for (t = 0; t < NTRK; t++) {
        prj.snd[t].p[P_VOL] = 15;
        prj.snd[t].p[P_ECHO] = 15;
        prj.snd[t].p[P_VERB] = 15;
    }
}

int main(void)
{
    uint32_t k, t, fx, a, b, id, kit, d, n = 0;
    /* 1. every factory sound, on its engine's track, with every track effect at the ends of A and B */
    for (k = 0; k < NPRESET; k++) {
        prj_new();
        t = PRESETS[k].engine == E_FM ? 1u : 0u;
        if (PRESETS[k].engine == E_FM) {
            sound_preset(1, k);
        } else {
            sound_preset(0, k);
            if (prj.snd[1].engine == E_FM) sound_preset(1, preset_first(E_PULSE));
        }
        prj.snd[t].p[P_VOL] = 15;
        for (fx = 1; fx < FXT_N; fx++)
            for (a = 0; a <= 15u; a += 15u)
                for (b = 0; b <= 15u; b += 15u) {
                    prj.snd[t].p[P_FXT] = (int8_t)fx;
                    prj.snd[t].p[P_FXA] = (int8_t)a;
                    prj.snd[t].p[P_FXB] = (int8_t)b;
                    prj.snd[t].p[P_FXM] = 15;
                    for (d = 0; d < 3u; d++) {      /* three notes, overlapping, loud */
                        ev_push(EV_ON, t, IS_TONAL(t) ? 36u + d * 19u : 1u + d * 5u, 15, 0, 0);
                        render(12);
                    }
                    ev_push(EV_OFF, t, 74, 0, 0, 0);
                    render(20);
                    n++;
                }
        quiet_all();
    }
    printf("1. %u factory sounds x track effects: ok (%u settings)\n", NPRESET, n);
    /* 2. PULSE with DETUNE at its top, and the live UNISON (two oscillators summed) */
    prj_new();
    prj.snd[0].p[P_DETUNE] = 15;
    prj.snd[0].p[P_TON] = 15;
    prj.snd[0].p[P_VOL] = 15;
    for (d = 0; d < 3u; d++) {
        lfx_keys = d == 1u ? 1u << LF_UNI : d == 2u ? 1u << LF_UNILO : 0u;
        ev_push(EV_ON, 0, 84, 15, 0, 0);
        render(80);
    }
    quiet_all();
    printf("2. PULSE DETUNE 15, UNISON: ok\n");
    /* 3. the kits: every drum at DECAY +8, DRIVE 15, TONE 13 (the one-pole low-pass), two voices overlapping */
    for (kit = 0; kit < NKIT; kit++) {
        prj_new();
        sound_preset(4, preset_named(E_KIT, (int32_t)kit));
        prj.snd[4].p[P_DECAY] = 8;
        prj.snd[4].p[P_DRIVE] = 15;
        prj.snd[4].p[P_KTON] = 13;
        prj.snd[4].p[P_VOL] = 15;
        for (d = 1; d <= NDRUM; d++) {
            ev_push(EV_ON, 4, d, 15, 0, 0);
            render(6);
            ev_push(EV_ON, 4, d, 15, 0, 0);
            render(30);
        }
        quiet_all();
    }
    printf("3. %u kits at DECAY +8, DRIVE 15: ok\n", NKIT);
    /* 4. FM loud: every FM sound, vol 15, panned hard each way, reverb and echo at 15, notes overlapping */
    for (k = 0; k < NPRESET; k++) {
        if (PRESETS[k].engine != E_FM) continue;
        prj_new();
        sound_preset(1, k);
        for (d = 0; d < 2u; d++) {
            prj.snd[1].p[P_PAN] = d ? 7 : -7;
            prj.snd[1].p[P_VOL] = 15;
            prj.snd[1].p[P_VERB] = 15;
            prj.snd[1].p[P_ECHO] = 15;
            for (a = 0; a < 8u; a++) {
                ev_push(EV_ON, 1, 43u + a * 5u, 15, 0, 0);
                render(10);
            }
        }
        quiet_all();
    }
    printf("4. FM loud, panned, reverb and echo 15: ok\n");
    /* 5. the demo, every fader up, with each master effect at its ends */
    for (fx = 0; fx < FXT_N; fx++)
        for (a = 0; a <= 15u; a += 15u) {
            prj_demo();
            loud_faders();
            prj.mfx[0] = (int8_t)fx;
            prj.mfx[1] = (int8_t)a;
            prj.mfx[2] = 15;
            prj.mfx[3] = 15;
            prj.mode = 1;
            sq_req = 1;
            render(400);
            quiet_all();
        }
    printf("5. the demo, faders up, %u master effects: ok\n", FXT_N);
    /* 6. every live effect held over the demo (faders up), on the master and on a track; then two at once */
    for (id = 0; id < LF_N; id++)
        for (t = 0; t < 2u; t++) {
            prj_demo();
            loud_faders();
            prj.mode = 1;
            lfx_target = (uint8_t)(t ? 5u : 0u);
            sq_req = 1;
            render(60);
            lfx_keys = 1u << id;
            render(250);
            lfx_keys = (1u << id) | (1u << ((id + 7u) % LF_N));
            render(120);
            lfx_keys = 0;
            render(60);
            quiet_all();
        }
    lfx_target = 0;
    printf("6. %u live effects held over the demo (master and a track): ok\n", LF_N);
    /* 7. a RETRIG in the LIVE lane must not lock the song on its beat */
    prj_demo();
    prj.mode = 1;
    prj.pat[prj.song[0].pat].live[7] = (uint8_t)(LF_AGAIN + 1u);
    sq_req = 1;
    {
        uint32_t seen = 0;
        for (k = 0; k < 2000u && !seen; k++) {
            render(1);
            if (sq_songpos != 0u) seen = 1;
        }
        if (!seen) { printf("FAIL  7. a RETRIG in the LIVE lane locks the song\n"); return 1; }
    }
    quiet_all();
    printf("7. a RETRIG in the LIVE lane plays once, the song goes on: ok\n");
    /* 8. everything ends: no voice left on once all is stopped */
    render(400);
    for (t = 0; t < NTRK; t++)
        if (drum[t][0].on || drum[t][1].on || smp[t][0].on || smp[t][1].on) {
            printf("FAIL  8. a voice of track %u never ends\n", t + 1u);
            return 1;
        }
    printf("8. every voice ended: ok\n");
    printf("stress_test: passed (%u blocks, %.1f s of sound, master peak %d)\n", blocks, blocks * 256.0 / 44100.0,
           peak_all);
    return 0;
}
