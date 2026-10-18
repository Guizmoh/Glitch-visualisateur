/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA 0.5's panel, driven on this computer as the FM-1's buttons and encoders would (tests/run_ui_test.sh): the empty start, the
 * pages of EDIT, LFO, ENV, FX and GLO and what SELECT does on them, the protected factory sounds, the FX page's sends (and that
 * they sound), the holds (yellow bar, the tools of SAVE), the metronome and its volume, the 16 / 32 / 64 steps. */
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
static uint32_t peak_of(uint32_t blocks)         /* the loudest sample of n blocks */
{
    uint32_t pk = 0, b, i;
    for (b = 0; b < blocks; b++) {
        block();
        for (i = 0; i < 2u * BLK; i++) {
            uint32_t a = (uint32_t)(out[i] < 0 ? -out[i] : out[i]);
            if (a > pk) pk = a;
        }
    }
    return pk;
}
static void enc(uint32_t e, int32_t d) { host_enc[e] += d; ui_input(); }
static void tap(uint32_t b) { button_down(b); fm1_ms += 80; button_up(b); fm1_ms += 40; }
static void fresh(void)
{
    uint32_t b;
    sq_req = 2;
    block();
    prj_new();
    ev_push(EV_KILL, NTRK, 0, 0, 0, 0);
    for (b = 0; b < 700u; b++) block();         /* (the echo and the reverb of the last test die out) */
    set_page(PG_TRACK);
    cur_trk = 0; ui_pat = 0; cur_row = 0; snd_page = 0; fx_sticky = 0; tools_open = 0; fx_down = 0; save_held = 0;
}

int main(void)
{
    uint32_t i, k, t, n, pk0 = 0, pk1 = 0, pk2 = 0;
    uint8_t seen[SP_N];
    fm1_ms = 1000;
    /* 1. a new FM-1 starts on an empty song at 100 BPM, in English */
    memset(host_settings, 0, sizeof host_settings);
    app_init();
    for (n = 0, k = 0; k < NPAT; k++)
        for (i = 0; i < NROW; i++)
            for (t = 0; t < NTRK; t++) n += prj.pat[k].c[i][t].note != 0;
    CHECK(n == 0 && prj.bpm == 100 && lang == LANG_EN, "1. first start: %u notes, %u BPM, language %u (want 0, 100, English)", n, prj.bpm, lang);
    set_page(PG_TRACK);

    /* 2. EDIT goes round its pages without LFO and MODULATION; LFO has those two; SELECT goes along the group and stops at its ends */
    for (t = 0; t < 3u; t++) {                  /* a pulse, the FM track, a sample track */
        uint32_t trkn = t == 0u ? 0u : t == 1u ? 1u : 5u;
        fresh();
        cur_trk = (uint8_t)trkn;
        memset(seen, 0, sizeof seen);
        tap(BTN_EDIT);
        CHECK(page == PG_SOUND && sp_at(trkn, snd_page) == SP_SON1, "2. EDIT opens SOUND (track %u)", trkn + 1u);
        for (k = 0; k < sp_n(trkn) + 2u; k++) {
            seen[sp_at(trkn, snd_page)] = 1;
            tap(BTN_EDIT);
        }
        CHECK(!seen[SP_LFO] && !seen[SP_MOD] && seen[SP_SON2] && seen[SP_FX] && seen[SP_TABLE],
              "2. EDIT's pages (track %u): LFO %u MOD %u SON2 %u FX %u TABLE %u", trkn + 1u, seen[SP_LFO], seen[SP_MOD], seen[SP_SON2],
              seen[SP_FX], seen[SP_TABLE]);
        tap(BTN_LFO);
        CHECK(page == PG_SOUND && sp_at(trkn, snd_page) == SP_LFO, "2. LFO opens the LFO page");
        tap(BTN_LFO);
        CHECK(sp_at(trkn, snd_page) == SP_MOD, "2. LFO again: MODULATION");
        tap(BTN_LFO);
        CHECK(sp_at(trkn, snd_page) == SP_LFO, "2. LFO again: the LFO");
        enc(ENC_SELECT, 1);
        CHECK(sp_at(trkn, snd_page) == SP_MOD, "2. SELECT on LFO: MODULATION");
        enc(ENC_SELECT, 5);
        CHECK(sp_at(trkn, snd_page) == SP_MOD, "2. SELECT stops at the end of the group");
        enc(ENC_SELECT, -1);
        CHECK(sp_at(trkn, snd_page) == SP_LFO, "2. SELECT back: the LFO");
        tap(BTN_EDIT);
        CHECK(sp_at(trkn, snd_page) == SP_SON1, "2. EDIT from LFO: SOUND");
        enc(ENC_SELECT, 1);
        CHECK(sp_at(trkn, snd_page) == SP_SON2, "2. SELECT on EDIT: SOUND 2");
        enc(ENC_SELECT, -3);
        CHECK(snd_page == 0, "2. SELECT stops at SOUND");
    }

    /* 3. the factory sound changes on SOUND only, and an edited sound is not replaced by a turn by mistake; ARP + PRESETS: engine */
    fresh();
    tap(BTN_EDIT);
    k = prj.snd[0].preset;
    enc(ENC_PRESETS, 1);
    CHECK(prj.snd[0].preset != k, "3. PRESETS on SOUND changes the factory sound");
    k = prj.snd[0].preset;
    enc(ENC_SELECT, 1);                         /* SOUND 2 */
    enc(ENC_PRESETS, 1);
    CHECK(prj.snd[0].preset == k, "3. PRESETS on SOUND 2 leaves the sound alone");
    enc(ENC_SELECT, -1);
    prj.snd[0].p[P_S0] = (int8_t)(prj.snd[0].p[P_S0] ^ 1);   /* edited */
    CHECK(!sound_is_preset(0), "3. the sound is edited");
    enc(ENC_PRESETS, 1);
    CHECK(prj.snd[0].preset == k && !sound_is_preset(0), "3. the first turn on an edited sound only warns");
    enc(ENC_PRESETS, 1);
    CHECK(prj.snd[0].preset != k && sound_is_preset(0), "3. the next turn replaces it");
    prj.snd[0].p[P_S0] = (int8_t)(prj.snd[0].p[P_S0] ^ 1);
    enc(ENC_PRESETS, -1);                       /* warns */
    fm1_ms += 3000u;                            /* too late: it asks again */
    k = prj.snd[0].preset;
    enc(ENC_PRESETS, -1);
    CHECK(prj.snd[0].preset == k, "3. after 3 s the warning is asked again");
    sound_preset(0, prj.snd[0].preset);
    tap(BTN_ENV);                               /* ENV: no sound change */
    k = prj.snd[0].preset;
    enc(ENC_PRESETS, 1);
    CHECK(page == PG_ENV && prj.snd[0].preset == k, "3. PRESETS on ENV leaves the sound alone");
    fresh();
    cur_trk = 1;                                /* the FM track: its operators' page, PRESETS = the operator */
    prj.snd[1].engine = E_FM;
    tap(BTN_EDIT);
    while (sp_at(1, snd_page) != SP_OP && snd_page < 7) tap(BTN_EDIT);
    k = prj.snd[1].preset;
    fm_op = 1;
    enc(ENC_PRESETS, 2);
    CHECK(sp_at(1, snd_page) == SP_OP && fm_op == 3 && prj.snd[1].preset == k, "3. OPERATOR: PRESETS picks the operator (%u)", fm_op);
    fresh();
    tap(BTN_EDIT);
    k = ENG(0);
    arp_held = 1;
    enc(ENC_PRESETS, 1);
    arp_held = 0;
    CHECK(ENG(0) != k, "3. ARP + PRESETS: the next engine");

    /* 4. ENV / MIX, FX, GLO: SELECT turns the pages */
    fresh();
    tap(BTN_ENV);
    CHECK(page == PG_ENV, "4. ENV");
    enc(ENC_SELECT, 1);
    CHECK(page == PG_MIX, "4. SELECT on ENV: MIX");
    enc(ENC_SELECT, -1);
    CHECK(page == PG_ENV, "4. SELECT on MIX: ENV");
    tap(BTN_GLO);
    CHECK(page == PG_SONG, "4. GLO: SONG");
    enc(ENC_SELECT, 1);
    CHECK(page == PG_GROOVE, "4. SELECT on SONG: GROOVE");
    enc(ENC_SELECT, 1);
    CHECK(page == PG_OPT, "4. SELECT on GROOVE: OPTIONS");
    enc(ENC_SELECT, -2);
    CHECK(page == PG_SONG, "4. SELECT back to SONG");
    prj.song_len = 3; prj.song[1].pat = 4; prj.song[2].pat = 5;
    enc(ENC_ALGORITHM, 1);
    CHECK(song_cur == 1 && ui_pat == 4, "4. ALGO on SONG: the entry (%u, pattern %u)", song_cur, ui_pat);
    enc(ENC_PRESETS, 1);
    CHECK(prj.song[1].pat == 5, "4. PRESETS on SONG: the entry's pattern");
    set_page(PG_GROOVE);
    prj.grv.len = 16;
    enc(ENC_ALGORITHM, 3);
    CHECK(gr_cur == 3, "4. ALGO on GROOVE: the step");

    /* 5. FX: a tap shows SENDS, again the LIVE page, again back; held from another page: LIVE while it is held; yellow bar */
    fresh();
    tap(BTN_EDIT);
    button_down(BTN_FX);
    CHECK(page == PG_SEND, "5. FX: the first page is SENDS");
    fm1_ms += 100;
    ui_input();
    CHECK(page == PG_SEND, "5. still SENDS before the hold");
    button_up(BTN_FX);
    CHECK(page == PG_SEND && fx_sticky, "5. a tap: SENDS stays");
    button_down(BTN_FX); button_up(BTN_FX);
    CHECK(page == PG_FX, "5. FX again: the second page (LIVE)");
    enc(ENC_SELECT, -1);
    CHECK(page == PG_SEND, "5. SELECT: SENDS again");
    enc(ENC_SELECT, 1);
    CHECK(page == PG_FX, "5. SELECT: LIVE");
    button_down(BTN_FX); button_up(BTN_FX);
    CHECK(page == PG_SOUND, "5. FX a third time: back where it was");
    button_down(BTN_FX);
    fm1_ms += 50;
    ui_input();
    CHECK(page == PG_SEND, "5. a hold begins on SENDS");
    fm1_ms += HOLD_FX_MS;
    ui_input();
    CHECK(page == PG_FX, "5. held past %u ms: LIVE", HOLD_FX_MS);
    button_up(BTN_FX);
    CHECK(page == PG_SOUND, "5. let go: back");
    button_down(BTN_HOME);                      /* the help: its bar fills first */
    fm1_ms += 200;
    ui_input();
    CHECK(page == PG_SOUND && home_held && fm1_ms - home_down_ms < HOLD_HOME_MS, "5. HOME held 200 ms: the bar fills, no help yet");
    fm1_ms += HOLD_HOME_MS;
    ui_input();
    CHECK(page == PG_HELP, "5. HOME held: the help");
    button_up(BTN_HOME);

    /* 6. SENDS: the saturation, the echo and the reverb of a track; the saturation is heard and bounded */
    fresh();
    prj.snd[0].p[P_VOL] = 12;
    set_page(PG_SEND);
    knob(0, 5);
    knob(1, 4);
    knob(2, 3);
    CHECK(prj.snd[0].sat == 5 && prj.snd[0].p[P_ECHO] == 4 && prj.snd[0].p[P_VERB] == 5, "6. SENDS knobs: sat %u echo %d verb %d", prj.snd[0].sat, prj.snd[0].p[P_ECHO], prj.snd[0].p[P_VERB]);
    cur_trk = 3;
    knob(0, 99);
    CHECK(prj.snd[3].sat == 15 && prj.snd[0].sat == 5, "6. SAT stops at 15 and is per track");
    cur_trk = 0;
    prj.snd[0].sat = 0;
    for (k = 0; k < 3u; k++) {                   /* a quiet note, with no saturation, a little, a lot */
        fresh();
        prj.snd[0].p[P_ECHO] = 0; prj.snd[0].p[P_VERB] = 0;
        prj.snd[0].sat = (uint8_t)(k == 0u ? 0u : k == 1u ? 4u : 15u);
        ev_push(EV_ON, 0, 60, 6, 0, 0);
        pk1 = peak_of(40);
        if (k == 0u) pk0 = pk1; else if (k == 1u) pk2 = pk1;
        CHECK(pk1 > 0 && pk1 < 60000u, "6. sat %u: peak %u (sound, no overflow)", prj.snd[0].sat, pk1);
    }
    CHECK(pk0 != pk2, "6. the saturation changes the sound (%u, %u)", pk0, pk2);

    /* 7. SAVE held: the tools */
    fresh();
    prj.pat[0].c[2][0].note = 60; prj.pat[0].c[2][0].vol = 12;
    prj.pat[0].c[3][1].note = 62; prj.pat[0].c[3][1].vol = 12;
    button_down(BTN_SAVE);
    fm1_ms += 200;
    ui_input();
    CHECK(!tools_open, "7. SAVE held 200 ms: the bar, no tools yet");
    fm1_ms += HOLD_SAVE_MS;
    ui_input();
    CHECK(tools_open && tools_sel == 0, "7. SAVE held: the tools open on OPTIONS");
    enc(ENC_SELECT, 3);
    CHECK(tools_sel == 3, "7. SELECT: CLEAR (%u)", tools_sel);
    enc(ENC_SELECT, 20);
    CHECK(tools_sel == TOOL_N - 1u, "7. SELECT stops at RANDOM");
    enc(ENC_SELECT, -3);                        /* COPY */
    CHECK(tools_sel == 3u, "7. SELECT back to CLEAR (%u)", tools_sel);
    button_up(BTN_SAVE);
    CHECK(!tools_open && prj.pat[0].c[2][0].note == 0 && prj.pat[0].c[3][1].note == 62, "7. CLEAR clears the track only (note %u, other track %u)", prj.pat[0].c[2][0].note, prj.pat[0].c[3][1].note);
    k = (uint32_t)undo_pop();
    CHECK(k == 0u && prj.pat[0].c[2][0].note == 60, "7. and it can be undone");
    button_down(BTN_SAVE); fm1_ms += 600; ui_input();
    enc(ENC_SELECT, 4);                         /* COPY */
    button_up(BTN_SAVE);
    ui_pat = 1;
    button_down(BTN_SAVE); fm1_ms += 600; ui_input();
    enc(ENC_SELECT, 5);                         /* PASTE */
    button_up(BTN_SAVE);
    CHECK(prj.pat[1].c[2][0].note == 60, "7. COPY then PASTE: pattern 2's track has the notes (%u)", prj.pat[1].c[2][0].note);
    button_down(BTN_SAVE); fm1_ms += 600; ui_input();
    enc(ENC_SELECT, 6);                         /* RANDOM */
    button_up(BTN_SAVE);
    for (n = 0, i = 0; i < NROW; i++) n += prj.pat[1].c[i][0].note != 0;
    CHECK(n > 0, "7. RANDOM writes notes (%u)", n);
    button_down(BTN_SAVE); fm1_ms += 600; ui_input();
    button_up(BTN_SAVE);
    CHECK(page == PG_OPT, "7. the first tool: OPTIONS");
    fresh();
    button_down(BTN_SAVE); button_up(BTN_SAVE);
    CHECK(page == PG_PROJ, "7. a tap on SAVE: PROJECTS");

    /* 8. the metronome: off, on, only while REC; three volumes; kept in the settings */
    fresh();
    set_page(PG_OPT);
    enc(ENC_ALGORITHM, 1);
    CHECK(set.metro == 1, "8. ALGO on OPTIONS: the metronome %u", set.metro);
    enc(ENC_ALGORITHM, 5);
    CHECK(set.metro == 2, "8. stops at REC only");
    enc(ENC_ALGORITHM, -9);
    CHECK(set.metro == 0, "8. OFF");
    enc(ENC_PRESETS, -9);
    CHECK(set.mvol == 0, "8. PRESETS: the volume %u", set.mvol);
    enc(ENC_PRESETS, 9);
    CHECK(set.mvol == 2, "8. HIGH");
    for (k = 0; k < 4u; k++) {
        fresh();
        met_vol = 1;
        met_mode = (uint8_t)(k == 0u ? 0u : k == 1u ? 1u : 2u);
        met_rec = (uint8_t)(k == 3u);
        sq_start_pat = 0; sq_start_pos = 0; sq_req = 1;
        pk1 = peak_of(120);                      /* an empty song: only the click can be heard */
        sq_req = 2; block();
        CHECK(k == 0u || k == 2u ? pk1 < 100u : pk1 > 1000u, "8. metronome mode %u, REC %u: peak %u", met_mode, met_rec, pk1);
    }
    for (k = 0; k < 3u; k++) {
        fresh();
        met_mode = 1;
        met_vol = (uint8_t)k;
        sq_start_pat = 0; sq_start_pos = 0; sq_req = 1;
        pk1 = peak_of(120);
        sq_req = 2; block();
        if (k == 0u) pk0 = pk1; else if (k == 1u) pk2 = pk1;
        else CHECK(pk0 < pk2 && pk2 < pk1, "8. volumes: %u < %u < %u", pk0, pk2, pk1);
    }
    met_mode = 0;
    memset(host_settings, 0, sizeof host_settings);   /* kept: 0.4's five bytes load, 0.5's seven keep the metronome */
    set.metro = 1; set.mvol = 2; set.lang = LANG_FR; set.theme = 1; set.font = 2; set.clock = 0; set.oct = 0;
    settings_save(&set, sizeof set);
    memset(&set, 0, sizeof set);
    app_init();
    CHECK(set.metro == 1 && set.mvol == 2 && lang == LANG_FR && g_font == 2, "8. the settings keep the metronome (%u, %u)", set.metro, set.mvol);
    memset(host_settings, 0, sizeof host_settings);
    { uint8_t v4[5] = {LANG_ES, 2, 0, 0, 1}; settings_save(v4, 5u); }
    memset(&set, 0, sizeof set);
    app_init();
    CHECK(lang == LANG_ES && theme == 2 && g_font == 1 && set.metro == 0 && set.mvol == 1, "8. 0.4's five bytes: language %u, theme %u, font %u, metronome off, medium", lang, theme, g_font);
    lang = LANG_EN;

    /* 9. 16, 32, 64 steps: OCT- / OCT+ on the grid; 64 goes on into the next pattern, in the loop and in the song */
    fresh();
    set_page(PG_GRID);
    CHECK(plen() == 16 && grid_pages() == 1, "9. a pattern starts at 16 steps");
    button_down(BTN_OCT_UP); button_up(BTN_OCT_UP);
    CHECK(plen() == 32 && grid_pages() == 2 && !pat_linked(0), "9. OCT+: 32 steps (%u)", plen());
    button_down(BTN_OCT_UP); button_up(BTN_OCT_UP);
    CHECK(plen() == 32 && pat_linked(0) && grid_pages() == 4, "9. OCT+: 64 steps, linked (pages %u)", grid_pages());
    button_down(BTN_OCT_UP); button_up(BTN_OCT_UP);
    CHECK(pat_linked(0) && grid_pages() == 4, "9. 64 is the most");
    enc(ENC_SELECT, 3);
    CHECK(grid_page == 3 && gpat(3) == 1 && grow(3) == 16, "9. SELECT: the grid's 4th page is the next pattern's second half (page %u pattern %u row %u)", grid_page, gpat(3), grow(3));
    grid_key(2, 1); grid_key(2, 0);              /* a tap on the 3rd key of that page */
    CHECK(prj.pat[1].c[18][0].note != 0 && prj.pat[0].c[18][0].note == 0, "9. a step of the second half is written into the next pattern");
    prj.pat[0].c[0][0].note = 60; prj.pat[0].c[0][0].vol = 12;
    sq_start_pat = 0; sq_start_pos = 0; prj.mode = 0; sq_next = 0xFF; sq_req = 1;
    {
        uint32_t seq[140], np[140], m = 0, last, guard = 0;
        block();
        last = sq_rowtick;
        seq[0] = sq_row; np[0] = sq_pat; m = 1;
        while (m < 140u && guard++ < 100000u) {
            block();
            if (sq_rowtick != last) { last = sq_rowtick; seq[m] = sq_row; np[m] = sq_pat; m++; }
        }
        for (i = 0, n = 0; i < 130u; i++) {
            uint32_t want_row = i % 32u, want_pat = (i / 32u) % 2u;
            if (seq[i] != want_row || np[i] != want_pat) n++;
        }
        CHECK(n == 0, "9. 64 steps play as one in the loop: %u wrong rows in 130 (first rows %u/%u %u/%u ... row 32: %u/%u, row 64: %u/%u)", n, np[0], seq[0], np[1], seq[1], np[32], seq[32], np[64], seq[64]);
    }
    sq_req = 2; block();
    fresh();                                    /* in a song: the pair counts as one entry */
    set_page(PG_GRID);
    prj.pat[0].len = 32; prj.pat[0].pad[0] = 1; prj.pat[1].len = 32;
    prj.pat[2].len = 16;
    prj.mode = 1; prj.song_len = 2; prj.song[0].pat = 0; prj.song[0].rep = 1; prj.song[1].pat = 2; prj.song[1].rep = 1;
    sq_start_pat = 0; sq_start_pos = 0; sq_req = 1;
    {
        uint32_t seq[140], np[140], m, last, guard = 0;
        block();
        last = sq_rowtick; seq[0] = sq_row; np[0] = sq_pat; m = 1;
        while (m < 100u && guard++ < 100000u) {
            block();
            if (sq_rowtick != last) { last = sq_rowtick; seq[m] = sq_row; np[m] = sq_pat; m++; }
        }
        CHECK(np[31] == 0 && np[32] == 1 && seq[32] == 0 && np[63] == 1 && np[64] == 2 && seq[64] == 0 && np[80] == 0 && seq[80] == 0,
              "9. song: P1 + P2 (64 steps), then P3 (16), then again: rows 31/32/64/80 in patterns %u %u %u %u", np[31], np[32], np[64], np[80]);
    }
    sq_req = 2; block();
    fresh();                                    /* taking it back */
    prj.pat[0].len = 32; prj.pat[0].pad[0] = 1;
    set_page(PG_GRID);
    button_down(BTN_OCT_DOWN); button_up(BTN_OCT_DOWN);
    CHECK(!pat_linked(0) && plen() == 32 && grid_pages() == 2, "9. OCT-: back to 32, the second half stays a pattern");
    button_down(BTN_OCT_DOWN); button_up(BTN_OCT_DOWN);
    CHECK(plen() == 16 && grid_pages() == 1, "9. OCT-: 16");
    prj.pat[1].len = 32; prj.pat[1].pad[0] = 1;  /* the next one is linked itself: no 64 on this one */
    ui_pat = 0; P()->len = 32;
    button_down(BTN_OCT_UP); button_up(BTN_OCT_UP);
    CHECK(!pat_linked(0), "9. refused when the next pattern goes on already");
    ui_pat = 31;
    P()->len = 32;
    button_down(BTN_OCT_UP); button_up(BTN_OCT_UP);
    CHECK(!pat_linked(31), "9. refused on the last pattern");

    /* 10. the buttons: SCL goes SCALE, MAGIC, back; the LED of LFO, the pages of the help */
    fresh();
    tap(BTN_SEL);
    CHECK(page == PG_SCALE, "10. SCL: SCALE");
    tap(BTN_SEL);
    CHECK(page == PG_MAGIC, "10. SCL again: MAGIC");
    tap(BTN_SEL);
    CHECK(page == PG_TRACK, "10. SCL a third time: TRACKS");
    /* 11. a 0.4 project (pads zero) and a damaged pad load safely */
    fresh();
    prj.pat[3].pad[0] = 0x77; prj.snd[2].sat = 200;
    prj.crc = 0;
    prj_sanitize();
    CHECK(prj.pat[3].pad[0] == 1 && prj.snd[2].sat == 0, "11. a damaged link byte or SAT is brought back (%u, %u)", prj.pat[3].pad[0], prj.snd[2].sat);
    printf("ui_test: %s\n", fails ? "FAILED" : "passed");
    return fails != 0;
}
