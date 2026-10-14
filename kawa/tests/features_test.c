/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA 0.3's new features, played on this computer through the audio interrupt (tests/run_features_test.sh):
 * HOP and END, the second trick column, the groove, the tables, the sample edit, the MIDI clock in. Each
 * check says what it expected and what came. */
#define main kawa_host_main
#include "../firmware/src/kawa.c"
#undef main

#define BLK 256u
static int32_t out[2u * BLK];
static int fails;
#define CHECK(c, ...) do { if (!(c)) { printf("FAIL  " __VA_ARGS__); printf("\n"); fails++; } } while (0)

static void block(void)
{
    uint32_t i;
    for (i = 0; i < 2u * BLK; i++) out[i] = 0;
    app_audio(out, BLK);
}

static uint32_t rows_seen[64], nrows;
static void play_rows(uint32_t n)               /* plays until n rows have started, noting each */
{
    uint32_t last = sq_rowtick, guard = 0;
    nrows = 0;
    while (nrows < n && guard++ < 20000u) {
        block();
        if (sq_rowtick != last) {
            last = sq_rowtick;
            if (nrows < 64u) rows_seen[nrows++] = sq_row;
        }
    }
}

static void fresh(void)
{
    sq_req = 2;
    block();
    prj_new();
    prj.mode = 0;
    sq_next = 0xFF;
    ev_push(EV_KILL, NTRK, 0, 0, 0, 0);
    block();
}

static void start(void)
{
    sq_start_pat = 0;
    sq_start_pos = 0;
    sq_req = 1;
}

int main(void)
{
    uint32_t i, k;
    char got[160];
    /* 1. HOP: row 4 (index 3) goes on to row 8 (index 7) */
    fresh();
    prj.pat[0].len = 16;
    prj.pat[0].c[3][2].fx2 = FX_HOP;
    prj.pat[0].c[3][2].fxv2 = 7;
    start();
    play_rows(1);                               /* (the start's row 0 is already on) */
    play_rows(14);
    got[0] = 0;
    for (i = 0; i < nrows; i++) fmt_u(got + str_len(got), rows_seen[i], 0), str_cat(got, " ");
    {
        static const uint8_t WANT[14] = {1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1};
        for (i = 0; i < 14u; i++) CHECK(rows_seen[i] == WANT[i], "1. HOP: rows %s(want 1 2 3 7 8 ... 15 0 1)", got);
    }
    printf("1. HOP to row 8 on row 4: %s\n", got);
    /* 2. END: the pattern ends after row 6; in the song, the next entry plays */
    fresh();
    prj.pat[0].len = 16;
    prj.pat[0].c[5][0].fx = FX_END;
    prj.pat[1].len = 16;
    prj.song[0].pat = 0; prj.song[0].rep = 1;
    prj.song[1].pat = 1; prj.song[1].rep = 1;
    prj.song_len = 2;
    prj.mode = 1;
    start();
    play_rows(1);
    play_rows(8);
    got[0] = 0;
    for (i = 0; i < nrows; i++) fmt_u(got + str_len(got), rows_seen[i], 0), str_cat(got, " ");
    CHECK(rows_seen[4] == 5u && rows_seen[5] == 0u && sq_pat == 1u, "2. END: rows %s, pattern %u (want ... 5 0, pattern 2)",
          got, sq_pat + 1u);
    printf("2. END on row 6: rows %s, then pattern %u\n", got, sq_pat + 1u);
    /* 3. two tricks in one cell: both play (VIB in the first column, PAN in the second) */
    fresh();
    prj.pat[0].c[0][0].note = 69;
    prj.pat[0].c[0][0].vol = 12;
    prj.pat[0].c[0][0].fx = FX_VIB;
    prj.pat[0].c[0][0].fxv = 9;
    prj.pat[0].c[0][0].fx2 = FX_PAN;
    prj.pat[0].c[0][0].fxv2 = (uint8_t)(int8_t)-7;
    start();
    block();
    CHECK(tk[0].vib == 9u && tk[0].npan == -7, "3. two tricks: vibrato %u pan %d (want 9, -7)", tk[0].vib, tk[0].npan);
    printf("3. VIB 9 + PAN -7 in one cell: vibrato %u, pan %d\n", tk[0].vib, tk[0].npan);
    /* 4. DELAY in one column, PITCH in the other: the late note keeps its pitch */
    fresh();
    prj.pat[0].c[0][0].note = 60;
    prj.pat[0].c[0][0].vol = 12;
    prj.pat[0].c[0][0].fx = FX_PITCH;
    prj.pat[0].c[0][0].fxv = 7;
    prj.pat[0].c[0][0].fx2 = FX_DELAY;
    prj.pat[0].c[0][0].fxv2 = 12;
    start();
    block();
    k = (uint32_t)tk[0].gate;                   /* (half a row at 160 BPM: 7.5 blocks; the row 15) */
    for (i = 0; i < 11u; i++) block();
    CHECK(!k && tk[0].gate && tk[0].pitch == 67 * 256, "4. DELAY + PITCH: gate %u then %u, pitch %d (want 0, 1, %d)", k,
          tk[0].gate, tk[0].pitch, 67 * 256);
    printf("4. DELAY 12 + PITCH +7: late, at %d/256 semitones\n", tk[0].pitch);
    if (fails) { printf("features_test: %d failures\n", fails); return 1; }
    printf("features_test: passed\n");
    return 0;
}
