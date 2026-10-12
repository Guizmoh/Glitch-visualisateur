/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the pages, the panel, the main loop.
 *
 *   HOME   PISTES   the tracker: 16 rows, six tracks, the track under the cursor wide
 *   SEQ    GRILLE   the track's 16 steps on the 16 white keys, as a Pocket Operator
 *   EDIT   SON      the track's sound: PRESETS a factory sound, the knobs its parameters (EDIT: next page)
 *   ENV    MIX      volume, pan, echo, tone; black keys mute
 *   LFO    MAGIE    16 tools on the white keys: chop the break, a beat, a melody in the scale...
 *   SCL    GAMME    root (a key), scale, lock, the cursor's step
 *   GLO    CHAINE   tempo, swing, the pattern's length, loop or song; the song list (white keys add)
 *   SAVE   PROJETS  five slots; SAVE held: undo
 *   FX     EFFETS   held: the live effects on the white keys (tap: the page stays); OCT-/+ the bank
 *   HOME held       the map of the panel
 *
 * Everywhere: SELECT the row, ALGORITHM the track, PRESETS the pattern (or the sound / the song entry),
 * KNOB 1-4 what the bottom line says, PLAY, REC (keys write at the cursor; while playing, on the beat),
 * ARP clears the cell, OCT-/OCT+ the keyboard's octave. */

enum { PG_TRACK, PG_GRID, PG_SOUND, PG_MIX, PG_MAGIC, PG_SCALE, PG_SONG, PG_PROJ, PG_FX, PG_HELP, PG_BOOT };
static const char *const PAGE_NAMES[LANG_N][11] = {
    {"PISTES", "GRILLE", "SON", "MIX", "MAGIE", "GAMME", "CHAINE", "PROJETS", "EFFETS", "AIDE", ""},
    {"TRACKS", "GRID", "SOUND", "MIX", "MAGIC", "SCALE", "SONG", "PROJECTS", "EFFECTS", "HELP", ""},
    {"PISTAS", "REJILLA", "SONIDO", "MEZCLA", "MAGIA", "ESCALA", "CANCION", "PROYECTO", "EFECTOS", "AYUDA", ""}};
#define PAGE_NAME PAGE_NAMES[lang]
static uint8_t page = PG_BOOT, page_back = PG_TRACK;
static uint8_t cur_row, cur_trk, ui_pat, rec, snd_page, grid_page, fx_bank, fx_sticky, mg_scope;
static int8_t oct_ofs;
static uint8_t mg_inten = 8, mg_seed = 1, song_cur, proj_slot = 1, proj_act, proj_arm;
static uint8_t brush_vol[NTRK] = {12, 12, 12, 12, 12, 12}, brush_fx[NTRK], brush_fxv[NTRK];
static uint32_t fx_down_ms, home_down_ms, save_down_ms, boot_ms, last_input_ms;
static uint8_t home_held, save_held, save_did;
static char toast_s[24];
static uint32_t toast_ms;
static uint32_t knob_ms[4];
static uint32_t prev_keys;
static uint8_t key_note[27], key_trk[27];
static int8_t grid_held = -1;                   /* a step held on the grid (its knobs edit it) */
static uint8_t grid_edit;                       /* the held step was edited (its release keeps it) */
static uint8_t brk_peak[BRK_N][224];            /* the break's outline (SON page), made once */
static uint8_t names_ok[NSLOT];
static char slot_name[NSLOT][16];
static uint32_t ui_frame_ms;
static int8_t arc_x[21], arc_y[21];             /* the knob gauge's dots */

static const char *const LANG_CODE[LANG_N] = {"FR", "EN", "ES"};
static struct { uint8_t lang; int8_t oct; uint8_t pad[2]; } set;   /* kept in the settings sector */
static uint8_t set_dirty;
static uint32_t set_ms;
static void set_lang(uint32_t l)
{
    lang = (uint8_t)(l % LANG_N);
    set.lang = lang;
    set_dirty = 1;
    set_ms = fm1_ms;
    g_force = 1;
}

static void toast(const char *s)
{
    uint32_t i = 0;
    while (s[i] && i < 23u) { toast_s[i] = s[i]; i++; }
    toast_s[i] = 0;
    toast_ms = fm1_ms;
}

static pat_t *P(void) { return &prj.pat[ui_pat]; }
static uint32_t plen(void) { uint32_t l = P()->len; return l && l <= NROW ? l : 16u; }
static cell_t *CUR(void) { return &P()->c[cur_row][cur_trk]; }

/* ---- text of a cell */
static void note_text(uint32_t t, uint32_t note, char *s, int wide)
{
    if (note == NOTE_NONE) { str_cat(s, wide ? " . " : " ."); return; }
    if (note == NOTE_OFF) { str_cat(s, wide ? "OFF" : "--"); return; }
    if (t == T_KIT) { str_cat(s, wide ? DRUM3[cell_idx(note) & 15u] : DRUM2[cell_idx(note) & 15u]); return; }
    if (t == T_CASSE) { char *p = s; if (wide) *p++ = 'S'; fmt_u(p, cell_idx(note) + 1u, 2); return; }
    if (wide) {
        s = str_cat(s, NOTE_NAME[note % 12u]);
        fmt_u(s, note / 12u ? note / 12u - 1u : 0u, 1);
    } else if (NOTE_NAME[note % 12u][1] == '#')
        str_cat(s, NOTE_NAME[note % 12u]);      /* narrow: C# ... or the octave of a natural note: A2 */
    else {
        s[0] = NOTE_NAME[note % 12u][0];
        fmt_u(s + 1, note / 12u ? note / 12u - 1u : 0u, 1);
    }
}
static void fxv_text(uint32_t t, const cell_t *c, char *s)
{
    int32_t v = (int8_t)c->fxv;
    s[0] = 0;
    switch (c->fx) {
    case FX_NONE: break;
    case FX_ARP: str_cat(s, CHORDS[c->fxv % 14u].name[lang]); break;
    case FX_ROLL: *s++ = 'X'; fmt_u(s, ROLL_N[c->fxv < 9u ? c->fxv : 8u], 0); break;
    case FX_BEND: case FX_PITCH: fmt_s(s, v); break;
    case FX_CHANCE: s = fmt_u(s, c->fxv * 10u, 0); str_cat(s, "%"); break;
    case FX_REV: str_cat(s, "<<"); break;
    case FX_SHAPE: {
        uint32_t e = TRK_ENGINE[t];
        const char *const *l = e == E_PULSE ? L_DUTY : e == E_WAVE ? L_WAVE : L_NOISE;
        uint32_t n = e == E_PULSE ? 5u : e == E_WAVE ? 8u : 2u, i;
        const char *w = l[lang * n + c->fxv % n];
        for (i = 0; i < 3u && w[i]; i++) s[i] = w[i];
        s[i] = 0;
        break;
    }
    default: fmt_u(s, c->fxv, 0); break;
    }
}

/* ---- the panel's LEDs: 0 off, 1 the glow, 2 lit */
static uint8_t led_want[41];
static void led(uint32_t id, uint32_t lvl) { if (id < 41u) led_want[id] = (uint8_t)lvl; }
#if defined(DINGHY_HOST) || defined(KAWA_WASM)
static void leds_flush(void) { host_leds(led_want); }
#else
static void leds_flush(void)
{
    uint32_t p, r;
    for (p = 0; p < FM1_NCOL; p++) {
        uint8_t on = 0, dim = 0;
        for (r = 1; r < 5u; r++) {
            int8_t id = FM1_KEYMAP[r][p];
            if (id < 0 || id > 40) continue;
            if (led_want[id] == 2u) on |= (uint8_t)(1u << r);
            else if (led_want[id] == 1u) dim |= (uint8_t)(1u << r);
        }
        fm1_led[p] = on;
        fm1_led_dim[p] = dim;
    }
}
#endif

static int quiet(void)
{
    uint32_t t;
    for (t = 0; t < 4u; t++)
        if (tone[t].stage || tone[t].amp) return 0;
    return !drum[0].on && !drum[1].on && !brkv[0].on && !brkv[1].on;
}

/* ================================================================ drawing */
#define ROW_Y0 32
#define ROW_H 12
#define GUT_W 16
#define FOC_W 92
#define NAR_W 25
static int32_t lane_x(uint32_t t)
{
    int32_t x = GUT_W;
    uint32_t k;
    for (k = 0; k < t; k++)
        x += k == cur_trk ? FOC_W : NAR_W;
    return x;
}
static int32_t lane_w(uint32_t t) { return t == cur_trk ? FOC_W : NAR_W; }
static uint16_t lane_col(uint32_t t, uint32_t bright) { return g_mix(C_BG, TRK_COL[t], bright); }

static void draw_mascot(int32_t x, int32_t y, uint32_t scale)
{
    static const uint16_t BODY_FX[2] = {RGB(255, 120, 200), RGB(255, 110, 70)};
    uint16_t pal[3] = {RGB(30, 18, 54), RGB(190, 160, 255), C_WHITE};
    uint32_t spr = SPR_IDLE, flip = 0, on = lfx_on, beat_age = 999;
    if (sq_play) {
        uint32_t f = sq_frac >> 24;             /* hop on the beat */
        beat_age = ((sq_row & 3u) * 256u + f);
        if (beat_age < 80u) spr = SPR_HOP;
        else if (beat_age > 900u) spr = SPR_SQUASH;
    }
    if ((fm1_ms % 3200u) < 140u && spr == SPR_IDLE) spr = SPR_BLINK;
    if (rec) pal[1] = RGB(255, 90, 120);
    if (on) {
        pal[1] = BODY_FX[(on & 0xFFFF0000u) ? 1 : 0];
        spr = SPR_WILD;
        if (on & (1u << LF_REV)) flip = 2;
        if (on & ((1u << LF_SCR) | (1u << LF_SCRF))) flip = (fm1_ms / 90u) & 1u;
        if (on & ((1u << LF_CRUSH) | (1u << LF_DECIM))) spr = SPR_SQUASH;
        if (on & ((1u << LF_TAPE) | (1u << LF_FREEZE))) { spr = SPR_SLEEP; pal[1] = RGB(120, 200, 255); }
    }
    if (!sq_play && fm1_ms - last_input_ms > 20000u) spr = SPR_SLEEP;
    g_sprite(x, y - (spr == SPR_HOP ? 1 : 0), spr, pal, scale, flip);
}

static void draw_top(void)
{
    char s[24];
    int32_t x;
    uint32_t i, beat = sq_play ? (sq_row & 15u) / 4u : 4u;
    if (!g_vis(0, 20)) return;
    g_rect(0, 0, 240, 20, C_BG);
    g_rect(0, 19, 240, 1, C_RULE);
    draw_mascot(2, 2, 1);
    if (page == PG_TRACK || page == PG_GRID || page == PG_MAGIC || page == PG_FX) {
        s[0] = 'P';
        fmt_u(s + 1, ui_pat + 1u, 2);
        x = g_text(22, 4, s, C_TXT, T_CROP | T_BOLD);
        if (page != PG_TRACK)
            g_text(x + 8, 4, PAGE_NAME[page], C_MID, T_CROP);
        else if (sq_play && sq_pat != ui_pat) { /* another one plays */
            s[0] = '>';
            fmt_u(s + 1, sq_pat + 1u, 2);
            g_text(x + 6, 4, s, C_FAINT, T_CROP);
        } else if (sq_next < NPAT && sq_play) { /* the next one, at the end of this one */
            s[0] = '>';
            fmt_u(s + 1, sq_next + 1u, 2);
            g_text(x + 6, 4, s, C_GOLD, T_CROP);
        }
    } else
        g_text(22, 4, PAGE_NAME[page], C_TXT, T_CROP | T_BOLD);
    if (prj.mode) {
        s[0] = 0;
        str_cat(fmt_u(s, (uint32_t)sq_songpos + 1u, 0), "/");
        fmt_u(s + str_len(s), prj.song_len, 0);
        x = 174 - g_text_w(s);
        g_icon(x - 11, 6, ICO_CHAIN, C_MID, 1);
        g_text(x, 4, s, C_MID, T_CROP);
    }
    fmt_u(s, prj.bpm, 0);
    g_text(203 - g_text_w(s), 4, s, C_TXT, T_CROP | T_BOLD);
    g_icon(207, 6, sq_play ? ICO_PLAY : ICO_STOP, sq_play ? C_GO : C_FAINT, 1);
    if (rec) g_icon(215, 6, ICO_REC, C_REC, 1);
    for (i = 0; i < 4u; i++)
        g_rect(226 + (int32_t)i * 3, 14, 2, 3, i == beat ? C_GOLD : C_RULE);
}

static void hint(uint32_t k, const char *label, const char *val, uint16_t c)
{
    int32_t x = (int32_t)k * 60;
    uint32_t hot = fm1_ms - knob_ms[k] < 700u;
    g_rect(x, 224, 60, 16, hot ? g_mix(C_BG2, c, 60) : C_BG2);
    g_rect(x + 59, 226, 1, 12, C_RULE);
    g_rect(x + 3, 230, 3, 3, c);
    if (label && label[0])
        x = g_text(x + 8, 226, label, C_FAINT, T_CROP) - 8 * 0;
    else
        x += 8;
    if (val)
        g_text(label && label[0] ? x + 2 : x, 226, val, hot ? C_WHITE : C_TXT, T_CROP);
}
static void hint_line(const char *s)
{
    g_rect(0, 224, 240, 16, C_BG2);
    g_text(4, 226, s, C_MID, T_CROP);
}

static void draw_toast(void)
{
    int32_t w;
    if (!toast_s[0] || fm1_ms - toast_ms > 1100u || !g_vis(104, 30)) return;
    w = g_text_w(toast_s) + 24;
    g_rrect(120 - w / 2, 106, w, 26, RGB(255, 236, 150));
    g_rrect(120 - w / 2 + 1, 107, w - 2, 24, RGB(46, 30, 80));
    g_text_c(120, 112, toast_s, C_GOLD, T_CROP | T_BOLD);
}

/* ---- PISTES */
static void draw_lane_head(void)
{
    uint32_t t;
    if (!g_vis(20, 12)) return;
    g_rect(0, 20, 240, 12, C_BG);
    for (t = 0; t < NTRK; t++) {
        int32_t x = lane_x(t), w = lane_w(t);
        uint16_t c = TRK_COL[t];
        int muted = (prj.mute | live_mute) >> t & 1u;
        g_rect(x, 20, w - 1, 11, muted ? C_BG2 : lane_col(t, t == cur_trk ? 110 : 50));
        g_icon(x + (t == cur_trk ? 3 : (w - 8) / 2), 22, ENGINE_ICON[TRK_ENGINE[t]], muted ? C_FAINT : (t == cur_trk ? C_WHITE : c), 1);
        if (t == cur_trk)
            g_text(x + 14, 20, TRK_NAME[t], C_WHITE, T_CROP);
        if (muted)
            g_rect(x + 2, 25, w - 5, 1, C_REC);
    }
    g_rect(233, 20, 7, 11, C_BG2);
}

static void draw_track(void)
{
    const pat_t *pt = P();
    uint32_t len = plen(), i, t, base, prow = sq_play && sq_pat == ui_pat ? sq_row : 0xFFu;
    uint32_t focus_row = (sq_play && sq_pat == ui_pat && !rec) ? prow : cur_row;
    char s[8];
    base = len > 16u ? (focus_row / 16u) * 16u : 0u;
    draw_lane_head();
    for (i = 0; i < 16u; i++) {
        uint32_t r = base + i;
        int32_t y = ROW_Y0 + (int32_t)i * ROW_H;
        uint16_t bg = (r % 4u) == 0u ? C_BEAT : (i & 1u) ? C_BG2 : C_BG;
        if (!g_vis(y, ROW_H)) continue;
        if (r >= len) {
            g_rect(0, y, 240, ROW_H, RGB(12, 8, 24));
            continue;
        }
        g_rect(0, y, 240, ROW_H, bg);
        if (r == prow) {
            g_icon(4, y + 2, ICO_PLAY, C_GO, 1);
        } else {
            fmt_u(s, r + 1u, 2);
            g_text(0, y, s, (r % 4u) == 0u ? C_MID : C_FAINT, T_CROP);
        }
        for (t = 0; t < NTRK; t++) {
            const cell_t *c = &pt->c[r][t];
            int32_t x = lane_x(t), w = lane_w(t);
            int wide = t == cur_trk;
            uint16_t col = TRK_COL[t];
            g_blend(x, y, w, ROW_H, col, wide ? 22 : 12);
            g_rect(x, y, 1, ROW_H, C_RULE);
            if (r == prow && fm1_ms - trig_ms[t] < 200u && c->note && c->note != NOTE_OFF)
                g_blend(x + 1, y, w - 1, ROW_H, col, 150u - (fm1_ms - trig_ms[t]) * 3u / 4u);
            if (r == cur_row && wide) {
                g_blend(x + 1, y, w - 1, ROW_H, rec ? C_REC : C_WHITE, 50);
                g_frame(x + 1, y, w - 1, ROW_H, rec ? C_REC : C_WHITE);
            }
            s[0] = 0;
            note_text(t, c->note, s, wide);
            if (wide) {
                uint16_t tc = c->note && c->note != NOTE_OFF ? g_mix(col, C_WHITE, 90) : C_FAINT;
                g_text(x + 4, y, s, tc, T_CROP | (c->note && c->note != NOTE_OFF ? T_BOLD : 0));
                if (c->note && c->note != NOTE_OFF) {   /* the volume as a bar */
                    int32_t h = (int32_t)(c->vol * 10u / 15u);
                    g_rect(x + 30, y + 11 - h, 2, h, g_mix(col, C_BG, 80));
                }
                if (c->fx) {
                    char v[8];
                    g_icon(x + 38, y + 2, FXD[c->fx % FX_N].icon, C_GOLD, 1);
                    fxv_text(t, c, v);
                    g_text(x + 50, y, v, C_GOLD, T_CROP);
                } else
                    g_text(x + 46, y, "...", C_RULE, T_CROP);
            } else {
                uint16_t tc = c->note && c->note != NOTE_OFF ? g_mix(C_BG, col, 120u + c->vol * 9u) : C_RULE;
                g_text(x + (w - 16) / 2, y, s, tc, T_CROP);
                if (c->fx)
                    g_rect(x + w - 3, y + 1, 2, 2, C_GOLD);
            }
        }
        if (pt->live[r] && pt->live[r] <= LF_N)
            g_rrect(234, y + 1, 5, ROW_H - 2, LBANK_COL[pt->live[r] > 16u]);
        else
            g_rect(233, y, 7, ROW_H, C_BG);
        if (r == prow)
            g_blend(GUT_W, y, 224, ROW_H, C_WHITE, 34);
    }
    {
        const cell_t *c = CUR();
        char a[8], b[8];
        a[0] = 0;
        note_text(cur_trk, c->note, a, 1);
        fmt_u(b, c->vol, 0);
        hint(0, "", a, TRK_COL[cur_trk]);
        hint(1, "V", c->note ? b : "-", TRK_COL[cur_trk]);
        hint(2, "", FXD[c->fx % FX_N].tag[lang], C_GOLD);
        fxv_text(cur_trk, c, b);
        hint(3, "", c->fx ? b : "-", C_GOLD);
    }
}

/* ---- tiles (GRILLE, EFFETS, MAGIE): the 16 white keys as 4 x 4 */
static void tile_xy(uint32_t i, int32_t *x, int32_t *y)
{
    *x = 1 + (int32_t)(i % 4u) * 60;
    *y = 40 + (int32_t)(i / 4u) * 46;
}
static void draw_tile(uint32_t i, uint16_t col, uint32_t lit, uint32_t icon, const char *name, const char *sub)
{
    int32_t x, y;
    char n[4];
    tile_xy(i, &x, &y);
    if (!g_vis(y, 44)) return;
    g_rrect(x, y, 58, 44, lit ? col : g_mix(C_BG2, col, 34));
    if (!lit) g_frame(x, y, 58, 44, g_mix(C_BG, col, 90));
    fmt_u(n, i + 1u, 0);
    g_text(x + 3, y + 1, n, lit ? C_BG : C_FAINT, T_CROP);
    if (icon < ICO_N) g_icon(x + 21, y + 4, icon, lit ? C_BG : col, 2);
    g_text_c(x + 29, y + 20, name, lit ? C_BG : C_TXT, T_CROP);
    if (sub && sub[0]) g_text_c(x + 29, y + 31, sub, lit ? g_mix(col, C_BG, 160) : C_MID, T_CROP);
}

static void draw_grid(void)
{
    const pat_t *pt = P();
    uint32_t len = plen(), i, base = grid_page * 16u, prow = sq_play && sq_pat == ui_pat ? sq_row : 0xFFu;
    uint16_t col = TRK_COL[cur_trk];
    char s[16], v[8];
    if (g_vis(20, 20)) {
        g_rect(0, 20, 240, 20, C_BG);
        g_icon(4, 24, ENGINE_ICON[TRK_ENGINE[cur_trk]], col, 1);
        g_text(16, 22, TRK_NAME[cur_trk], col, T_CROP | T_BOLD);
        s[0] = 0;
        note_text(cur_trk, brush_note[cur_trk], s, 1);
        g_text(110, 22, s, C_TXT, T_CROP);
        if (brush_fx[cur_trk]) {
            cell_t b = {0, 0, brush_fx[cur_trk], brush_fxv[cur_trk]};
            g_icon(150, 24, FXD[b.fx].icon, C_GOLD, 1);
            fxv_text(cur_trk, &b, v);
            g_text(160, 22, v, C_GOLD, T_CROP);
        }
        if (len > 16u) {
            s[0] = 0;
            str_cat(fmt_u(s, base + 1u, 0), "+");
            g_text(204, 22, s, C_MID, T_CROP);
        }
    }
    if (g_vis(38, 2)) g_rect(0, 38, 240, 2, C_BG);
    for (i = 0; i < 16u; i++) {
        uint32_t r = base + i;
        int32_t x, y;
        const cell_t *c = &pt->c[r < NROW ? r : 0][cur_trk];
        tile_xy(i, &x, &y);
        if (!g_vis(y - 2, 48)) continue;
        g_rect(x - 1, y - 2, 60, 48, C_BG);
        if (r >= len) {
            g_frame(x, y, 58, 44, C_BG2);
            continue;
        }
        if (c->note) {
            uint16_t f = c->note == NOTE_OFF ? C_BG2 : g_mix(C_BG, col, 80u + c->vol * 8u);
            g_rrect(x, y, 58, 44, f);
            s[0] = 0;
            note_text(cur_trk, c->note, s, 1);
            g_text_c(x + 29, y + 15, s, c->note == NOTE_OFF ? C_FAINT : C_WHITE, T_CROP | T_BOLD);
            if (c->fx) {
                g_icon(x + 47, y + 3, FXD[c->fx % FX_N].icon, C_GOLD, 1);
                fxv_text(cur_trk, c, v);
                g_text_c(x + 29, y + 30, v, C_GOLD, T_CROP);
            }
        } else {
            g_rrect(x, y, 58, 44, (r % 4u) == 0u ? C_BEAT : C_BG2);
        }
        fmt_u(s, r + 1u, 0);
        g_text(x + 3, y + 1, s, C_FAINT, T_CROP);
        if (r == prow) {
            g_frame(x, y, 58, 44, C_WHITE);
            g_frame(x + 1, y + 1, 56, 42, C_WHITE);
        }
        if (grid_held == (int32_t)i)
            g_frame(x + 2, y + 2, 54, 40, C_GOLD);
    }
    if (grid_held >= 0) {
        const cell_t *c = &pt->c[base + (uint32_t)grid_held][cur_trk];
        s[0] = 0;
        note_text(cur_trk, c->note, s, 1);
        fmt_u(v, c->vol, 0);
        hint(0, "", s, C_GOLD);
        hint(1, "V", v, C_GOLD);
        hint(2, "", FXD[c->fx % FX_N].tag[lang], C_GOLD);
        fxv_text(cur_trk, c, v);
        hint(3, "", c->fx ? v : "-", C_GOLD);
    } else {
        cell_t b = {0, 0, brush_fx[cur_trk], brush_fxv[cur_trk]};
        s[0] = 0;
        note_text(cur_trk, brush_note[cur_trk], s, 1);
        fmt_u(v, brush_vol[cur_trk], 0);
        hint(0, "", s, col);
        hint(1, "V", v, col);
        hint(2, "", FXD[b.fx % FX_N].tag[lang], col);
        fxv_text(cur_trk, &b, v);
        hint(3, "", b.fx ? v : "-", col);
    }
}

/* ---- SON */
static void make_peaks(void)
{
    uint32_t b, x;
    for (b = 0; b < BRK_N; b++)
        for (x = 0; x < 224u; x++) {
            uint32_t a = x * BRK_LEN / 224u, z = (x + 1u) * BRK_LEN / 224u, m = 0;
            for (; a < z; a++) {
                int32_t v = BRK_ULAW[BRK_DATA[b][a]];
                uint32_t av = (uint32_t)(v < 0 ? -v : v);
                if (av > m) m = av;
            }
            brk_peak[b][x] = (uint8_t)(m >> 9);
        }
}

static void draw_env(int32_t x0, int32_t y0, int32_t w, int32_t h, const int8_t *p, uint16_t c)
{
    int32_t a = p[P_ATT] * 3 + 1, d = p[P_DEC] * 3 + 1, r = p[P_REL] * 3 + 1, sus = h - p[P_SUS] * h / 15;
    int32_t x1 = x0 + a, x2 = x1 + d, x3 = x0 + w - r - 1;
    if (x3 < x2 + 4) x3 = x2 + 4;
    g_line(x0, y0 + h, x1, y0, c);
    g_line(x1, y0, x2, y0 + sus, c);
    g_line(x2, y0 + sus, x3, y0 + sus, c);
    g_line(x3, y0 + sus, x3 + r > x0 + w ? x0 + w : x3 + r, y0 + h, c);
}

static void draw_sound(void)
{
    uint32_t t = cur_trk, e = TRK_ENGINE[t], i;
    const int8_t *p = prj.snd[t].p;
    const pdesc_t *pd = PDESC[e];
    uint16_t col = TRK_COL[t];
    char s[24];
    if (g_vis(20, 20)) {
        const preset_t *pr = &PRESETS_OF[e][prj.snd[t].preset % NPRESETS_OF[e]];
        int same = 1;
        g_rect(0, 20, 240, 20, C_BG);
        g_icon(4, 24, ENGINE_ICON[e], col, 1);
        g_text(16, 22, TRK_NAME[t], col, T_CROP | T_BOLD);
        for (i = 0; i < NPARAM; i++)
            if (pr->p[i] != p[i] && i != P_PAN) same = 0;
        s[0] = 0;
        str_cat(str_cat(s, pr->name[lang]), same ? "" : "*");
        g_text(84, 22, s, C_TXT, T_CROP);
        s[0] = 0;
        fmt_u(s, snd_page + 1u, 0);
        str_cat(s, e == E_KIT ? "/2" : "/3");
        g_text(212, 22, s, C_MID, T_CROP);
    }
    if (g_vis(40, 102)) {
        g_rect(0, 40, 240, 102, C_BG);
        g_rrect(4, 42, 232, 98, C_BG2);
        if (e == E_PULSE || e == E_WAVE || e == E_NOISE) {
            int32_t x, py = 0;
            for (x = 0; x < 128; x++) {         /* two cycles of the wave */
                uint32_t ph = (uint32_t)x << 26, sh = (uint32_t)p[P_SHAPE];
                int32_t v;
                if (e == E_PULSE) {
                    static const uint32_t DUTY[5] = {0x20000000u, 0x40000000u, 0x80000000u, 0xC0000000u, 0x60000000u};
                    v = ph < DUTY[sh % 5u] ? 1000 : -1000;
                } else if (e == E_WAVE)
                    v = ((int32_t)WAVES[sh & 7u][ph >> 27] * 2 - 15) * 66;
                else
                    v = (int32_t)((xr(&rnd_main) >> 20) & 1u ? 1000 : -1000) * (int32_t)((x * 7 + 3) % 5 + 1) / 5;
                v = 91 - v * 36 / 1000;
                if (x) g_line(10 + x - 1, py, 10 + x, v, col);
                py = v;
            }
            draw_env(146, 56, 84, 70, p, C_GOLD);
            g_text(146, 44, "ADSR", C_FAINT, T_CROP);
        } else if (e == E_KIT) {
            for (i = 0; i < 16u; i++) {
                int32_t x = 8 + (int32_t)(i % 8u) * 28, y = 48 + (int32_t)(i / 8u) * 44;
                int lit = drum[0].on && drum[0].drum == i;
                g_rrect(x, y, 26, 40, lit ? col : g_mix(C_BG2, col, 40));
                g_text_c(x + 13, y + 14, DRUM2[i], lit ? C_BG : C_TXT, T_CROP | T_BOLD);
            }
        } else {
            uint32_t b = (uint32_t)clampi(p[P_BRK], 0, BRK_N - 1), x, playing = 99;
            const brkv_t *v = brkv[0].on ? &brkv[0] : brkv[1].on ? &brkv[1] : 0;
            if (v) playing = (v->pos >> 16) * 16u / BRK_LEN;
            for (x = 0; x < 224u; x++) {
                int32_t h = brk_peak[b][x] * 38 / 64;
                uint32_t sl = x * 16u / 224u;
                g_rect(8 + (int32_t)x, 91 - h, 1, h * 2 + 1, sl == playing ? C_WHITE : g_mix(C_BG2, col, (sl & 1u) ? 200 : 150));
            }
            for (i = 0; i < 16u; i++) {
                int32_t x = 8 + (int32_t)(i * 224u / 16u);
                uint32_t tg = BRK_TAG[b][i];
                g_rect(x, 46, 1, 90, C_RULE);
                if (tg & 1u) g_rect(x + 3, 132, 4, 4, RGB(255, 140, 60));
                if (tg & 2u) g_rect(x + 8, 132, 4, 4, C_WHITE);
            }
        }
    }
    for (i = 0; i < 4u; i++) {                  /* the four knob cards */
        uint32_t k = snd_page * 4u + i, j, n;
        const pdesc_t *d = &pd[k];
        int32_t x = 1 + (int32_t)i * 60, y = 144, v = p[k];
        if (!g_vis(y, 80)) continue;
        g_rect(x - 1, y, 60, 80, C_BG);
        if (!d->name[0]) continue;
        g_rrect(x, y + 2, 58, 76, fm1_ms - knob_ms[i] < 700u ? g_mix(C_BG2, col, 50) : C_BG2);
        g_text_c(x + 29, y + 6, d->name[lang], C_MID, T_CROP);
        n = (uint32_t)(((v - d->lo) * 20) / (d->hi - d->lo ? d->hi - d->lo : 1));
        for (j = 0; j <= 20u; j++)
            g_rect(x + 27 + arc_x[j], y + 44 + arc_y[j], 2, 2, j <= n ? col : C_RULE);
        s[0] = 0;
        if (d->kind == K_LIST || d->kind == K_NAMES) str_cat(s, pd_value(d, v));
        else if (d->kind == K_SIGN) fmt_s(s, v);
        else if (d->kind == K_PAN) { if (v == 0) str_cat(s, "C"); else { s[0] = v < 0 ? TR('G', 'L', 'I') : TR('D', 'R', 'D'); fmt_u(s + 1, (uint32_t)(v < 0 ? -v : v), 0); } }
        else fmt_u(s, (uint32_t)v, 0);
        g_text_c(x + 29, y + 38, s, C_WHITE, T_CROP | T_BOLD);
    }
    if (g_vis(224, 16))
        hint_line(TR("PRESETS: SON  EDIT: PAGE", "PRESETS: SOUND  EDIT: PAGE", "PRESETS: SONIDO EDIT: PAG."));
}

/* ---- MIX */
static void draw_mix(void)
{
    uint32_t t;
    char s[8];
    if (g_vis(20, 204)) g_rect(0, 20, 240, 204, C_BG);
    for (t = 0; t < NTRK; t++) {
        const int8_t *p = prj.snd[t].p;
        int32_t x = (int32_t)t * 40, lv = level[t], h, vy;
        uint16_t col = TRK_COL[t];
        int muted = (prj.mute | live_mute) >> t & 1u;
        if (t == cur_trk) g_frame(x + 1, 21, 38, 202, C_WHITE);
        g_icon(x + 16, 25, ENGINE_ICON[TRK_ENGINE[t]], muted ? C_FAINT : col, 1);
        h = 0;                                   /* the level, log-ish */
        while (lv > 64 && h < 30) { lv = (lv * 3) >> 2; h++; }
        h = h * 140 / 30;
        g_rect(x + 12, 40, 16, 140, C_BG2);
        g_rect(x + 12, 180 - h, 16, h, muted ? C_FAINT : g_mix(C_BG, col, 200));
        vy = 180 - p[P_VOL] * 140 / 15;
        g_rect(x + 8, vy, 24, 2, C_WHITE);
        g_rect(x + 19 + p[P_PAN] * 2, 186, 3, 6, C_TXT);
        g_rect(x + 6, 189, 28, 1, C_RULE);
        g_rect(x + 6, 198, p[P_ECHO] * 28 / 15, 3, C_GOLD);
        if (muted) g_text_c(x + 20, 205, "M", C_REC, T_CROP | T_BOLD);
        else { fmt_u(s, (uint32_t)p[P_VOL], 0); g_text_c(x + 20, 205, s, C_MID, T_CROP); }
    }
    if (g_vis(224, 16)) {
        const int8_t *p = prj.snd[cur_trk].p;
        char a[8], b[8], c[8], d[8];
        fmt_u(a, (uint32_t)p[P_VOL], 0);
        fmt_s(b, p[P_PAN]);
        fmt_u(c, (uint32_t)p[P_ECHO], 0);
        fmt_u(d, (uint32_t)p[P_TON], 0);
        hint(0, "VOL", a, TRK_COL[cur_trk]);
        hint(1, "PAN", b, TRK_COL[cur_trk]);
        hint(2, TR("ECH", "ECH", "ECO"), c, TRK_COL[cur_trk]);
        hint(3, TR("TON", "TON", "TON"), d, TRK_COL[cur_trk]);
    }
}

/* ---- MAGIE, EFFETS */
static void draw_magic(void)
{
    uint32_t i;
    char s[8];
    static const uint16_t MG_COL = RGB(255, 210, 90);
    if (g_vis(20, 20)) {
        g_rect(0, 20, 240, 20, C_BG);
        g_icon(4, 24, mg_scope ? ICO_CHAIN : ENGINE_ICON[TRK_ENGINE[cur_trk]], mg_scope ? C_GOLD : TRK_COL[cur_trk], 1);
        g_text(16, 22, mg_scope ? TR("TOUT LE MOTIF", "WHOLE PATTERN", "TODO EL PATRON") : TRK_NAME[cur_trk], mg_scope ? C_GOLD : TRK_COL[cur_trk], T_CROP | T_BOLD);
    }
    if (g_vis(38, 2)) g_rect(0, 38, 240, 2, C_BG);
    for (i = 0; i < MG_N; i++) {
        int32_t x, y;
        tile_xy(i, &x, &y);
        if (g_vis(y - 2, 48)) g_rect(x - 1, y - 2, 60, 48, C_BG);
        draw_tile(i, MG_COL, 0, MAGIC[i].icon, MAGIC[i].name[lang], MAGIC[i].sub[lang]);
    }
    if (g_vis(224, 16)) {
        fmt_u(s, mg_inten, 0);
        hint(0, TR("FORCE", "AMT", "FZA"), s, MG_COL);
        fmt_u(s, mg_seed, 0);
        hint(1, TR("DE", "DIE", "DADO"), s, MG_COL);
        hint(2, "", L_SCOPE[mg_scope], MG_COL);
        hint(3, "", "", C_FAINT);
    }
}

static void draw_fx(void)
{
    uint32_t i, t, on = lfx_on;
    uint16_t col = LBANK_COL[fx_bank];
    if (g_vis(20, 20)) {
        g_rect(0, 20, 240, 20, C_BG);
        for (i = 0; i < 2u; i++) {
            int32_t x = 4 + (int32_t)i * 62;
            if (i == fx_bank) g_rrect(x, 22, 58, 15, LBANK_COL[i]);
            else g_frame(x, 22, 58, 15, g_mix(C_BG, LBANK_COL[i], 120));
            g_text_c(x + 29, 23, LBANK_NAME[i], i == fx_bank ? C_BG : LBANK_COL[i], T_CROP | T_BOLD);
        }
        if (rec && sq_play) { g_rrect(134, 22, 30, 15, C_REC); g_text_c(149, 23, "REC", C_WHITE, T_CROP); }
        for (t = 0; t < NTRK; t++) {             /* the mutes (black keys 1-6) */
            int32_t x = 172 + (int32_t)t * 11;
            int muted = (prj.mute | live_mute) >> t & 1u;
            g_rrect(x, 24, 9, 11, muted ? C_BG2 : TRK_COL[t]);
            if (muted) g_frame(x, 24, 9, 11, TRK_COL[t]);
        }
    }
    if (g_vis(38, 2)) g_rect(0, 38, 240, 2, C_BG);
    for (i = 0; i < 16u; i++) {
        uint32_t id = fx_bank * 16u + i;
        int32_t x, y;
        tile_xy(i, &x, &y);
        if (g_vis(y - 2, 48)) g_rect(x - 1, y - 2, 60, 48, C_BG);
        draw_tile(i, col, on >> id & 1u, LFX[id].icon, LFX[id].name[lang], LFX[id].sub[lang]);
    }
    if (g_vis(224, 16))
        hint_line(fx_sticky ? TR("OCT:BANQUE  NOIR:MUET  FX:FIN", "OCT:BANK  BLACK:MUTE  FX:END", "OCT:BANCO  NEGRA:MUTE  FX:FIN")
                            : TR("OCT:BANQUE  NOIRES:MUETS", "OCT:BANK  BLACK KEYS:MUTE", "OCT:BANCO  NEGRAS:SILENCIO"));
}

/* ---- GAMME */
static void draw_scale(void)
{
    uint32_t i, mask = SCALES[prj.scale % 12u].mask;
    char s[16];
    static const uint8_t WHITE7[7] = {0, 2, 4, 5, 7, 9, 11}, BLACK5[5] = {1, 3, 6, 8, 10};
    static const uint8_t BLACK_X[5] = {0, 1, 3, 4, 5};
    if (g_vis(20, 204)) g_rect(0, 20, 240, 204, C_BG);
    s[0] = 0;
    str_cat(s, NOTE_NAME[prj.root % 12u]);
    if (s[1] == '-') s[1] = 0;
    g_text_l(16, 32, s, C_GOLD);
    g_text(64, 34, SCALES[prj.scale % 12u].name[lang], C_TXT, T_BOLD);
    g_text(64, 50, prj.lock ? TR("VERROU: LES TOUCHES", "LOCKED: THE KEYS", "FIJA: LAS TECLAS")
                            : TR("LIBRE: CHROMATIQUE", "FREE: CHROMATIC", "LIBRE: CROMATICA"), C_MID, T_CROP);
    g_text(64, 62, prj.lock ? TR("RESTENT DANS LA GAMME", "STAY IN THE SCALE", "QUEDAN EN LA ESCALA")
                            : TR("TOUTES LES NOTES", "ALL THE NOTES", "TODAS LAS NOTAS"), C_FAINT, T_CROP);
    for (i = 0; i < 7u; i++) {                  /* one octave from C, the scale's notes lit */
        uint32_t n = WHITE7[i], in = mask >> ((n + 12u - prj.root) % 12u) & 1u;
        int32_t x = 8 + (int32_t)i * 32;
        g_rrect(x, 86, 30, 96, in ? (n == prj.root ? C_GOLD : RGB(220, 210, 255)) : RGB(70, 60, 110));
        if (n == prj.root) g_text_c(x + 15, 164, "*", C_BG, T_BOLD);
    }
    for (i = 0; i < 5u; i++) {
        uint32_t n = BLACK5[i], in = mask >> ((n + 12u - prj.root) % 12u) & 1u;
        int32_t x = 8 + (int32_t)BLACK_X[i] * 32 + 22;
        g_rrect(x, 86, 18, 58, in ? (n == prj.root ? C_GOLD : RGB(150, 120, 230)) : RGB(30, 22, 56));
        g_frame(x, 86, 18, 58, C_BG);
    }
    g_text(8, 192, TR("UNE TOUCHE = TONIQUE", "A KEY = THE ROOT", "UNA TECLA = TONICA"), C_FAINT, T_CROP);
    s[0] = 0;
    fmt_u(str_cat(s, TR("PAS ", "STEP ", "PASO ")), prj.step, 0);
    g_text(176, 192, s, C_MID, T_CROP);
    if (g_vis(224, 16)) {
        char a[4] = {0}, b[8];
        str_cat(a, NOTE_NAME[prj.root % 12u]);
        if (a[1] == '-') a[1] = 0;
        hint(0, TR("TON", "KEY", "TON"), a, C_GOLD);
        hint(1, "", TR("GAMME", "SCALE", "ESCALA"), C_GOLD);
        hint(2, "", prj.lock ? TR("VERROU", "LOCK", "FIJA") : TR("LIBRE", "FREE", "LIBRE"), C_GOLD);
        fmt_u(b, prj.step, 0);
        hint(3, TR("PAS", "STP", "PAS"), b, C_GOLD);
    }
}

/* ---- CHAINE */
static uint16_t pat_col(uint32_t p) { return TRK_COL[p % NTRK]; }
static void draw_song(void)
{
    uint32_t i, top = song_cur >= 24u ? ((song_cur - 16u) / 8u) * 8u : 0u;
    char s[16];
    if (g_vis(20, 204)) g_rect(0, 20, 240, 204, C_BG);
    if (g_vis(22, 60)) {
        fmt_u(s, prj.bpm, 0);
        g_text_l(8, 26, s, C_WHITE);
        g_text(64, 28, "BPM", C_FAINT, T_CROP);
        s[0] = 0;
        str_cat(fmt_u(str_cat(s, "SWING "), prj.swing, 0), "%");
        g_text(64, 42, s, C_MID, T_CROP);
        g_rrect(150, 26, 84, 18, prj.mode ? C_GOLD : C_BG2);
        g_text_c(192, 29, prj.mode ? TR("CHAINE", "SONG", "CANCION") : TR("BOUCLE", "LOOP", "BUCLE"), prj.mode ? C_BG : C_TXT, T_CROP | T_BOLD);
        s[0] = 0;
        str_cat(fmt_u(str_cat(s, "P"), ui_pat + 1u, 2), ":");
        str_cat(fmt_u(s + str_len(s), plen(), 0), TR(" PAS", " STEPS", " PASOS"));
        g_text(236 - g_text_w(s), 48, s, C_MID, T_CROP);
        g_rect(4, 66, 232, 1, C_RULE);
    }
    for (i = 0; i < 32u; i++) {
        uint32_t k = top + i;
        int32_t x = 4 + (int32_t)(i % 8u) * 29, y = 72 + (int32_t)(i / 8u) * 36;
        if (!g_vis(y, 32)) continue;
        if (k < prj.song_len) {
            uint32_t pn = prj.song[k];
            int playing = sq_play && prj.mode && k == sq_songpos;
            g_rrect(x, y, 27, 30, playing ? C_WHITE : g_mix(C_BG2, pat_col(pn), 110));
            fmt_u(s, pn + 1u, 2);
            g_text_c(x + 14, y + 9, s, playing ? C_BG : C_WHITE, T_CROP | T_BOLD);
        } else if (k == prj.song_len)
            g_text_c(x + 14, y + 9, "+", C_FAINT, T_CROP);
        if (k == song_cur) g_frame(x - 1, y - 1, 29, 32, C_GOLD);
    }
    if (g_vis(224, 16)) {
        char a[8], b[8], c[8];
        fmt_u(a, prj.bpm, 0);
        fmt_u(b, prj.swing, 0);
        fmt_u(c, plen(), 0);
        hint(0, "BPM", a, C_GOLD);
        hint(1, "SW", b, C_GOLD);
        hint(2, TR("PAS", "STP", "PAS"), c, C_GOLD);
        hint(3, "", prj.mode ? TR("CHAINE", "SONG", "CANCION") : TR("BOUCLE", "LOOP", "BUCLE"), C_GOLD);
    }
}

/* ---- PROJETS */
static const char *const PROJ_ACTS[LANG_N][4] = {{"SAUVER", "CHARGER", "NOUVEAU", "DEMO"},
                                                 {"SAVE", "LOAD", "NEW", "DEMO"}, {"GUARDAR", "CARGAR", "NUEVO", "DEMO"}};
#define PROJ_ACT PROJ_ACTS[lang]
static void draw_proj(void)
{
    uint32_t k;
    char s[24];
    if (g_vis(20, 204)) g_rect(0, 20, 240, 204, C_BG);
    g_text(8, 24, TR("EN COURS:", "CURRENT:", "ACTUAL:"), C_FAINT, T_CROP);
    g_text(84, 24, prj.name, C_GOLD, T_CROP | T_BOLD);
    for (k = 0; k < NSLOT; k++) {
        int32_t y = 44 + (int32_t)k * 30;
        uint16_t bg = k == proj_slot ? RGB(70, 50, 120) : C_BG2;
        if (!g_vis(y, 28)) continue;
        g_rrect(6, y, 228, 26, bg);
        if (k == proj_slot) g_frame(6, y, 228, 26, C_GOLD);
        s[0] = 0;
        if (k == 0u) str_cat(s, "AUTO");
        else fmt_u(s, k, 0);
        g_text(14, y + 7, s, C_MID, T_CROP | T_BOLD);
        g_text(62, y + 7, names_ok[k] ? slot_name[k] : TR("- VIDE -", "- EMPTY -", "- VACIO -"), names_ok[k] ? C_TXT : C_FAINT, T_CROP);
    }
    if (g_vis(196, 26)) {
        g_rrect(6, 196, 228, 24, proj_arm ? C_GOLD : C_BG2);
        s[0] = 0;
        str_cat(str_cat(s, PROJ_ACT[proj_act]), proj_arm ? " ? OCT+" : "  (OCT+)");
        g_text_c(120, 202, s, proj_arm ? C_BG : C_TXT, T_CROP | T_BOLD);
    }
    if (g_vis(224, 16)) {
        char a[4];
        fmt_u(a, proj_slot, 0);
        hint(0, "SLOT", proj_slot ? a : "A", C_GOLD);
        hint(1, "", PROJ_ACT[proj_act], C_GOLD);
        hint(2, "LANG", LANG_CODE[lang], C_GOLD);
        hint(3, "", TR("+: OUI", "+: YES", "+: SI"), C_FAINT);
    }
}

/* ---- AIDE (HOME held): the panel */
static void draw_help(void)
{
    static const char *const BT[12] = {"FX", "SCL", "ENV", "LFO", "EDIT", "GLO", "HOME", "SAVE", "ARP", "SEQ", "PLAY", "REC"};
    static const char *const NMS[LANG_N][12] = {
        {"EFFETS", "GAMME", "MIX", "MAGIE", "SON", "CHAINE", "PISTES", "PROJETS", "EFFACE", "GRILLE", "JOUE", "ENREG"},
        {"EFFECTS", "SCALE", "MIX", "MAGIC", "SOUND", "SONG", "TRACKS", "PROJECTS", "CLEAR", "GRID", "PLAY", "REC"},
        {"EFECTOS", "ESCALA", "MEZCLA", "MAGIA", "SONIDO", "CANCION", "PISTAS", "PROYECTO", "BORRAR", "REJILLA", "TOCAR", "GRABAR"}};
    static const char *const KNS[LANG_N][12] = {
        {"SELECT", "LIGNE", "ALGO", "PISTE", "PRESETS", "MOTIF / SON", "KNOB 1-4", "LIGNE DU BAS", "OCT- OCT+",
         "OCTAVE, BANQUE", "SAVE TENU", "ANNULER"},
        {"SELECT", "ROW", "ALGO", "TRACK", "PRESETS", "PATTERN / SOUND", "KNOB 1-4", "THE BOTTOM LINE", "OCT- OCT+",
         "OCTAVE, BANK", "SAVE HELD", "UNDO"},
        {"SELECT", "FILA", "ALGO", "PISTA", "PRESETS", "PATRON / SONIDO", "KNOB 1-4", "LA LINEA DE ABAJO", "OCT- OCT+",
         "OCTAVA, BANCO", "SAVE PULS.", "DESHACER"}};
    const char *const *NM = NMS[lang], *const *KN = KNS[lang];
    uint32_t i;
    if (g_vis(20, 204)) g_rect(0, 20, 240, 204, C_BG);
    for (i = 0; i < 12u; i++) {
        int32_t x = i < 6u ? 4 : 122, y = 24 + (int32_t)(i % 6u) * 15;
        g_rrect(x, y, 38, 13, RGB(70, 56, 120));
        g_text_c(x + 19, y, BT[i], C_WHITE, T_CROP | T_BOLD);
        g_text(x + 42, y, NM[i], C_GOLD, T_CROP);
    }
    g_rect(4, 116, 232, 1, C_RULE);
    for (i = 0; i < 6u; i++) {
        int32_t y = 122 + (int32_t)i * 16;
        g_text(6, y, KN[i * 2u], C_WHITE, T_CROP | T_BOLD);
        g_text(92, y, KN[i * 2u + 1u], C_GOLD, T_CROP);
    }
    if (g_vis(224, 16)) hint_line("KAWA " APP_VER " - Pocket Tracker");
}

static void draw_boot(void)
{
    static const uint16_t pal[3] = {RGB(30, 18, 54), RGB(190, 160, 255), C_WHITE};
    uint32_t t = fm1_ms - boot_ms, hop = (t / 180u) % 4u == 0u;
    g_rect(0, g_y0, 240, (int32_t)BAND_H, C_BG);
    g_sprite(88, 40 - (hop ? 6 : 0), hop ? SPR_HOP : (t % 1400u < 120u ? SPR_BLINK : SPR_IDLE), pal, 4, 0);
    g_text_l(88, 124, "KAWA", C_WHITE);
    g_text_c(120, 162, "Pocket Tracker", C_GOLD, T_BOLD);
    g_text_c(120, 180, "by Omnipotard", C_MID, 0);
    g_text_c(120, 214, "V" APP_VER, C_FAINT, T_CROP);
}

static void draw_all(void)
{
    if (page == PG_BOOT) { draw_boot(); return; }
    draw_top();
    switch (page) {
    case PG_TRACK: draw_track(); break;
    case PG_GRID: draw_grid(); break;
    case PG_SOUND: draw_sound(); break;
    case PG_MIX: draw_mix(); break;
    case PG_MAGIC: draw_magic(); break;
    case PG_SCALE: draw_scale(); break;
    case PG_SONG: draw_song(); break;
    case PG_PROJ: draw_proj(); break;
    case PG_FX: draw_fx(); break;
    case PG_HELP: draw_help(); break;
    }
    draw_toast();
}

/* ================================================================ input */
static void set_page(uint32_t p)
{
    if (page == PG_FX && p != PG_FX) {
        lfx_keys = 0;                           /* leaving the effects: they all stop */
        rec_live = 0;
    }
    if (p == PG_PROJ) {
        uint32_t k;
        for (k = 0; k < NSLOT; k++)
            names_ok[k] = (uint8_t)slot_valid(k, slot_name[k]);
        proj_arm = 0;
    }
    if (p == PG_GRID && grid_page * 16u >= plen())
        grid_page = 0;
    grid_held = -1;
    page = (uint8_t)p;
}

static void play_toggle(void)
{
    if (sq_play) {
        sq_req = 2;
        return;
    }
    sq_start_pat = ui_pat;
    sq_start_pos = 0;
    if (prj.mode) {                             /* the song: from the cursor's entry, else from where the pattern is */
        uint32_t k;
        sq_start_pos = song_cur < prj.song_len ? song_cur : 0u;
        if (page != PG_SONG)
            for (k = 0; k < prj.song_len; k++)
                if (prj.song[k] == ui_pat) { sq_start_pos = (uint8_t)k; break; }
    }
    sq_next = 0xFF;
    sq_req = 1;
}

/* the note a key plays on track t (and the trick it carries: black keys roll the drum, reverse the slice) */
static uint32_t key_to_note(uint32_t t, uint32_t k, uint8_t *fx, uint8_t *fxv)
{
    *fx = 0;
    *fxv = 0;
    if (IS_TONAL(t)) {
        int32_t n = (int32_t)KEY0 + (int32_t)k + 12 * oct_ofs + (t == T_ONDE ? -12 : 0) + (t == T_BRUIT ? 24 : 0);
        n = clampi(n, 12, 119);
        return prj.lock ? scale_snap((uint32_t)n) : (uint32_t)n;
    }
    {
        int32_t w = WHITE_OF_KEY[k];
        if (w < 0) {
            w = k ? WHITE_OF_KEY[k - 1u] : 0;
            *fx = t == T_KIT ? FX_ROLL : FX_REV;
            *fxv = t == T_KIT ? 1u : 0u;
        }
        return (uint32_t)w + 1u;
    }
}

static void write_cell(uint32_t pi, uint32_t r, uint32_t t, uint32_t note, uint32_t vol, uint32_t fx, uint32_t fxv, int merge)
{
    cell_t *c = &prj.pat[pi].c[r][t];
    undo_push_merge(pi, merge);
    c->note = (uint8_t)note;
    c->vol = (uint8_t)vol;
    c->fx = (uint8_t)fx;
    c->fxv = (uint8_t)fxv;
}

static void key_down(uint32_t k)
{
    uint8_t fx, fxv;
    uint32_t t = cur_trk, note = key_to_note(t, k, &fx, &fxv), vol = brush_vol[t];
    if (page == PG_SCALE) {                     /* GAMME: a key is the root */
        prj.root = (uint8_t)((KEY0 + k) % 12u);
        touched();
    }
    key_note[k] = (uint8_t)note;
    key_trk[k] = (uint8_t)t;
    brush_note[t] = note;
    ev_push(EV_ON, t, note, vol, fx, fxv);
    if (!rec || (page != PG_TRACK && page != PG_GRID && page != PG_SOUND))
        return;
    if (sq_play) {                              /* live take: on the nearest row */
        uint32_t pi = sq_pat, r = sq_row, len = prj.pat[pi].len ? prj.pat[pi].len : 16u;
        if (sq_frac > 0x80000000u) {
            r = (r + 1u) % len;
            sq_suppress[t] = 1;
        }
        write_cell(pi, r, t, note, vol, fx, fxv, 1);
    } else {                                    /* step entry at the cursor */
        write_cell(ui_pat, cur_row, t, note, vol, fx, fxv, 1);
        cur_row = (uint8_t)((cur_row + prj.step) % plen());
    }
}

static void key_up(uint32_t k)
{
    ev_push(EV_OFF, key_trk[k], key_note[k], 0, 0, 0);
}

static void cell_turn(cell_t *c, uint32_t pi, uint32_t t, uint32_t knob, int32_t d, int preview)
{
    int32_t v;
    undo_push_merge(pi, 1);
    switch (knob) {
    case 0: {                                   /* the note: ... empty, OFF, notes */
        int32_t lo = IS_TONAL(t) ? 12 : 1, hi = IS_TONAL(t) ? 119 : 16;
        int32_t n = c->note == NOTE_NONE ? -2 : c->note == NOTE_OFF ? -1 : c->note;
        while (d) {
            int32_t s = d > 0 ? 1 : -1;
            d -= s;
            if (n == -2) n = s > 0 ? (int32_t)brush_note[t] : -2;
            else if (n == -1) n = s > 0 ? (int32_t)brush_note[t] : -2;
            else if (s < 0 && n <= lo) n = -1;
            else if (IS_TONAL(t) && prj.lock) n = (int32_t)scale_step((uint32_t)n, s);
            else n = clampi(n + s, lo, hi);
        }
        c->note = n == -2 ? NOTE_NONE : n == -1 ? NOTE_OFF : (uint8_t)n;
        if (c->note && c->note != NOTE_OFF) {
            if (!c->vol) c->vol = brush_vol[t];
            brush_note[t] = c->note;
            if (preview && !sq_play) ev_push(EV_ON, t, c->note, c->vol, c->fx, c->fxv);
        }
        break;
    }
    case 1:
        if (!c->note) break;
        c->vol = (uint8_t)clampi((int32_t)c->vol + d, 1, 15);
        brush_vol[t] = c->vol;
        break;
    case 2:
        v = ((int32_t)c->fx + d) % (int32_t)FX_N;
        if (v < 0) v += FX_N;
        c->fx = (uint8_t)v;
        c->fxv = (uint8_t)FXD[v].def;
        break;
    case 3:
        if (!c->fx) break;
        v = clampi((int8_t)c->fxv + d, FXD[c->fx].lo, FXD[c->fx].hi);
        c->fxv = (uint8_t)(int8_t)v;
        break;
    }
}

static void knob(uint32_t i, int32_t d)
{
    knob_ms[i] = fm1_ms;
    switch (page) {
    case PG_TRACK:
        cell_turn(CUR(), ui_pat, cur_trk, i, d, 1);
        break;
    case PG_GRID:
        if (grid_held >= 0) {
            grid_edit = 1;
            cell_turn(&P()->c[grid_page * 16u + (uint32_t)grid_held][cur_trk], ui_pat, cur_trk, i, d, 1);
        } else {
            cell_t b = {(uint8_t)brush_note[cur_trk], brush_vol[cur_trk], brush_fx[cur_trk], brush_fxv[cur_trk]};
            cell_turn(&b, ui_pat, cur_trk, i, d, 1);
            if (b.note && b.note != NOTE_OFF) brush_note[cur_trk] = b.note;
            brush_vol[cur_trk] = b.vol ? b.vol : brush_vol[cur_trk];
            brush_fx[cur_trk] = b.fx;
            brush_fxv[cur_trk] = b.fxv;
        }
        break;
    case PG_SOUND: {
        uint32_t k = snd_page * 4u + i;
        const pdesc_t *pd = &PDESC[TRK_ENGINE[cur_trk]][k];
        if (pd->name[0]) {
            prj.snd[cur_trk].p[k] = (int8_t)clampi(prj.snd[cur_trk].p[k] + d, pd->lo, pd->hi);
            touched();
        }
        break;
    }
    case PG_MIX: {
        static const uint8_t K[4] = {P_VOL, P_PAN, P_ECHO, P_TON};
        const pdesc_t *pd = &PDESC[0][K[i]];
        prj.snd[cur_trk].p[K[i]] = (int8_t)clampi(prj.snd[cur_trk].p[K[i]] + d, pd->lo, pd->hi);
        touched();
        break;
    }
    case PG_MAGIC:
        if (i == 0u) mg_inten = (uint8_t)clampi(mg_inten + d, 0, 15);
        else if (i == 1u) mg_seed = (uint8_t)clampi(mg_seed + d, 0, 99);
        else if (i == 2u) mg_scope = (uint8_t)clampi(mg_scope + d, 0, 1);
        break;
    case PG_SCALE:
        if (i == 0u) prj.root = (uint8_t)((prj.root + 12 + d % 12 + 12) % 12);
        else if (i == 1u) prj.scale = (uint8_t)clampi(prj.scale + d, 0, 11);
        else if (i == 2u) prj.lock = (uint8_t)clampi(prj.lock + d, 0, 1);
        else prj.step = (uint8_t)clampi(prj.step + d, 0, 8);
        touched();
        break;
    case PG_SONG:
        if (i == 0u) prj.bpm = (uint16_t)clampi(prj.bpm + d, 40, 300);
        else if (i == 1u) prj.swing = (uint8_t)clampi(prj.swing + d, 50, 75);
        else if (i == 2u) { undo_push_merge(ui_pat, 1); P()->len = (uint8_t)clampi((int32_t)plen() + d, 1, NROW); }
        else prj.mode = (uint8_t)clampi(prj.mode + d, 0, 1);
        touched();
        break;
    case PG_PROJ:
        if (i == 0u) proj_slot = (uint8_t)clampi(proj_slot + d, 0, NSLOT - 1);
        else if (i == 1u) proj_act = (uint8_t)clampi(proj_act + d, 0, 3);
        else if (i == 2u) set_lang((uint32_t)((int32_t)lang + (d > 0 ? 1 : LANG_N - 1)));   /* the screen's language */
        proj_arm = 0;
        break;
    }
}

static void pat_select(int32_t d)
{
    ui_pat = (uint8_t)clampi(ui_pat + d, 0, NPAT - 1);
    if (cur_row >= plen()) cur_row = 0;
    if (sq_play && !prj.mode) sq_next = ui_pat == sq_pat ? 0xFF : ui_pat;   /* at the end of the one playing */
}

static void proj_do(void)
{
    if (!proj_arm) { proj_arm = 1; return; }
    proj_arm = 0;
    if (sq_play) { sq_req = 2; }
    switch (proj_act) {
    case 0:
        if (proj_slot == 0u) { toast("SLOT AUTO"); break; }
        toast(prj_save(proj_slot) ? TR("ERREUR", "ERROR", "ERROR") : TR("SAUVE !", "SAVED !", "GUARDADO !"));
        break;
    case 1:
        if (prj_load(proj_slot)) toast(TR("RIEN ICI", "NOTHING HERE", "NADA AQUI"));
        else { toast(TR("CHARGE !", "LOADED !", "CARGADO !")); ui_pat = 0; cur_row = 0; set_page(PG_TRACK); }
        break;
    case 2: prj_new(); undo_n = 0; ui_pat = 0; cur_row = 0; toast(prj.name); set_page(PG_TRACK); break;
    case 3: prj_demo(); undo_n = 0; ui_pat = 0; cur_row = 0; toast("DEMO !"); set_page(PG_TRACK); break;
    }
    {
        uint32_t k;
        for (k = 0; k < NSLOT; k++) names_ok[k] = (uint8_t)slot_valid(k, slot_name[k]);
    }
}

static void button_down(uint32_t b)
{
    switch (b) {
    case BTN_PLAY: play_toggle(); break;
    case BTN_REC: rec ^= 1u; break;
    case BTN_FX:
        if (page == PG_FX && fx_sticky) { set_page(page_back); fx_sticky = 0; break; }
        if (page != PG_FX) page_back = page == PG_HELP ? PG_TRACK : page;
        set_page(PG_FX);
        fx_sticky = 0;
        fx_down_ms = fm1_ms;
        break;
    case BTN_HOME: home_down_ms = fm1_ms; home_held = 1; set_page(PG_TRACK); break;
    case BTN_SEQ: set_page(page == PG_GRID ? PG_TRACK : PG_GRID); break;
    case BTN_EDIT:
        if (page == PG_SOUND) {
            snd_page = (uint8_t)((snd_page + 1u) % 3u);
            if (TRK_ENGINE[cur_trk] == E_KIT && snd_page == 1u) snd_page = 2;
        } else { set_page(PG_SOUND); snd_page = 0; }
        break;
    case BTN_ENV: set_page(page == PG_MIX ? PG_TRACK : PG_MIX); break;
    case BTN_LFO: set_page(page == PG_MAGIC ? PG_TRACK : PG_MAGIC); break;
    case BTN_SEL: set_page(page == PG_SCALE ? PG_TRACK : PG_SCALE); break;
    case BTN_GLO: set_page(page == PG_SONG ? PG_TRACK : PG_SONG); break;
    case BTN_SAVE: save_down_ms = fm1_ms; save_held = 1; save_did = 0; break;
    case BTN_ARP:
        if (page == PG_TRACK) {
            write_cell(ui_pat, cur_row, cur_trk, 0, 0, 0, 0, 0);
            if (rec) cur_row = (uint8_t)((cur_row + prj.step) % plen());
        } else if (page == PG_FX) {
            undo_push(ui_pat);
            memset(P()->live, 0, sizeof P()->live);
            toast(TR("LIVE EFFACE", "LIVE CLEARED", "LIVE BORRADO"));
        } else if (page == PG_SONG && song_cur < prj.song_len) {
            uint32_t k;
            for (k = song_cur; k + 1u < prj.song_len; k++) prj.song[k] = prj.song[k + 1u];
            if (prj.song_len > 1u) prj.song_len--;
            touched();
        } else if (page == PG_GRID && grid_held >= 0) {
            write_cell(ui_pat, grid_page * 16u + (uint32_t)grid_held, cur_trk, 0, 0, 0, 0, 0);
            grid_edit = 1;
        }
        break;
    case BTN_OCT_DOWN:
    case BTN_OCT_UP: {
        int32_t d = b == BTN_OCT_UP ? 1 : -1;
        if (page == PG_FX) { fx_bank = d > 0; lfx_keys = 0; }
        else if (page == PG_PROJ) { if (d > 0) proj_do(); else { proj_arm = 0; set_page(PG_TRACK); } }
        else if (page == PG_SONG) {
            if (d > 0 && prj.song_len < NSONG) {
                uint32_t k, at = song_cur < prj.song_len ? song_cur + 1u : prj.song_len;
                for (k = prj.song_len; k > at; k--) prj.song[k] = prj.song[k - 1u];
                prj.song[at] = song_cur < prj.song_len ? prj.song[song_cur] : ui_pat;
                prj.song_len++;
                song_cur = (uint8_t)at;
            } else if (d < 0 && song_cur < prj.song_len && prj.song_len > 1u) {
                uint32_t k;
                for (k = song_cur; k + 1u < prj.song_len; k++) prj.song[k] = prj.song[k + 1u];
                prj.song_len--;
            }
            touched();
        } else
            oct_ofs = (int8_t)clampi(oct_ofs + d, -3, 3);
        break;
    }
    }
}

static void button_up(uint32_t b)
{
    switch (b) {
    case BTN_FX:
        if (page == PG_FX && !fx_sticky) {
            if (fm1_ms - fx_down_ms < 350u) fx_sticky = 1;   /* a tap: the page stays */
            else set_page(page_back);
        }
        break;
    case BTN_HOME:
        home_held = 0;
        if (page == PG_HELP) set_page(PG_TRACK);
        break;
    case BTN_SAVE:
        save_held = 0;
        if (!save_did) set_page(page == PG_PROJ ? PG_TRACK : PG_PROJ);
        break;
    }
}

static void grid_key(uint32_t i, int down)
{
    uint32_t r = grid_page * 16u + i;
    if (r >= plen()) return;
    if (down) {
        grid_held = (int8_t)i;
        grid_edit = 0;
        return;
    }
    if (grid_held == (int8_t)i && !grid_edit) { /* a tap: on / off */
        cell_t *c = &P()->c[r][cur_trk];
        if (c->note) write_cell(ui_pat, r, cur_trk, 0, 0, 0, 0, 0);
        else {
            write_cell(ui_pat, r, cur_trk, brush_note[cur_trk], brush_vol[cur_trk], brush_fx[cur_trk], brush_fxv[cur_trk], 0);
            if (!sq_play) ev_push(EV_ON, cur_trk, brush_note[cur_trk], brush_vol[cur_trk], brush_fx[cur_trk], brush_fxv[cur_trk]);
        }
    }
    if (grid_held == (int8_t)i) grid_held = -1;
}

static void keys_input(void)
{
    uint32_t keys = fm1_in.notes | fm1_input_note_edges(), down = keys & ~prev_keys, up = prev_keys & ~fm1_in.notes, k;
    prev_keys = fm1_in.notes;
    if (down | up) last_input_ms = fm1_ms;
    for (k = 0; k < 27u; k++) {
        int32_t w = WHITE_OF_KEY[k], bl = BLACK_OF_KEY[k];
        uint32_t dn = down >> k & 1u, u = up >> k & 1u;
        if (!dn && !u) continue;
        switch (page) {
        case PG_FX:
            if (w >= 0) {
                uint32_t id = fx_bank * 16u + (uint32_t)w;
                if (dn) lfx_keys |= 1u << id;
                else lfx_keys &= ~(1u << id);
                rec_live = (uint8_t)(rec && sq_play);
            } else if (dn && bl < 6)
                live_mute ^= (uint8_t)(1u << bl);
            break;
        case PG_GRID:
            if (w >= 0) grid_key((uint32_t)w, (int)dn);
            else if (dn && bl < 6) { cur_trk = (uint8_t)bl; grid_held = -1; }
            break;
        case PG_MAGIC:
            if (dn && w >= 0) {
                const char *r = magic_run((uint32_t)w, ui_pat, cur_trk, mg_scope, mg_inten, mg_seed);
                char s[24];
                s[0] = 0;
                str_cat(str_cat(str_cat(s, MAGIC[w].name[lang]), " "), r);
                toast(s);
                mg_seed = (uint8_t)((mg_seed + 1u) % 100u);
            } else if (dn && bl < 6)
                cur_trk = (uint8_t)bl;
            break;
        case PG_MIX:
            if (bl >= 0) { if (dn && bl < 6) { prj.mute ^= (uint8_t)(1u << bl); touched(); } }
            else if (dn) key_down(k); else key_up(k);
            break;
        case PG_SONG:
            if (dn && w >= 0 && song_cur <= prj.song_len && song_cur < NSONG) {
                prj.song[song_cur] = (uint8_t)w;
                if (song_cur == prj.song_len) prj.song_len++;
                song_cur++;
                touched();
            }
            break;
        case PG_PROJ:
            if (dn && w >= 0 && w < (int32_t)NSLOT) { proj_slot = (uint8_t)w; proj_arm = 0; }
            break;
        default:
            if (dn) key_down(k);
            else key_up(k);
            break;
        }
    }
}

static void ui_input(void)
{
    uint32_t rel, b = fm1_input_edges(&rel), i;
    int32_t d;
    if (b | rel) last_input_ms = fm1_ms;
    if (page == PG_BOOT) {
        if (b || fm1_ms - boot_ms > 1600u || fm1_in.notes) set_page(PG_TRACK);
        return;
    }
    for (i = 0; i < 14u; i++) {
        if (b >> i & 1u) button_down(i);
        if (rel >> i & 1u) button_up(i);
    }
    if (home_held && page == PG_TRACK && fm1_ms - home_down_ms > 500u) set_page(PG_HELP);
    if (save_held && !save_did && fm1_ms - save_down_ms > 600u) {   /* SAVE held: undo */
        int p = undo_pop();
        save_did = 1;
        toast(p < 0 ? TR("RIEN A ANNULER", "NOTHING TO UNDO", "NADA QUE DESHACER") : TR("ANNULE", "UNDONE", "DESHECHO"));
        if (p >= 0) ui_pat = (uint8_t)p;
    }
    if ((d = fm1_enc_take(ENC_SELECT)) != 0) {
        last_input_ms = fm1_ms;
        switch (page) {
        case PG_GRID: if (plen() > 16u) grid_page = (uint8_t)(d > 0 ? 1u : 0u); break;
        case PG_SONG: song_cur = (uint8_t)clampi(song_cur + d, 0, prj.song_len < NSONG ? prj.song_len : NSONG - 1); break;
        case PG_PROJ: proj_slot = (uint8_t)clampi(proj_slot + d, 0, NSLOT - 1); proj_arm = 0; break;
        case PG_SOUND: snd_page = (uint8_t)clampi(snd_page + d, 0, 2); if (TRK_ENGINE[cur_trk] == E_KIT && snd_page == 1u) snd_page = d > 0 ? 2 : 0; break;
        default: {
            int32_t r = ((int32_t)cur_row + d) % (int32_t)plen();
            cur_row = (uint8_t)(r < 0 ? r + (int32_t)plen() : r);
            break;
        }
        }
    }
    if ((d = fm1_enc_take(ENC_ALGORITHM)) != 0) {
        last_input_ms = fm1_ms;
        cur_trk = (uint8_t)clampi(cur_trk + d, 0, NTRK - 1);
        if (page == PG_SOUND && TRK_ENGINE[cur_trk] == E_KIT && snd_page == 1u) snd_page = 0;
        grid_held = -1;
    }
    if ((d = fm1_enc_take(ENC_PRESETS)) != 0) {
        last_input_ms = fm1_ms;
        if (page == PG_SOUND) {
            uint32_t e = TRK_ENGINE[cur_trk], n = NPRESETS_OF[e];
            sound_preset(cur_trk, (uint32_t)(((int32_t)prj.snd[cur_trk].preset + d % (int32_t)n + (int32_t)n) % (int32_t)n));
            touched();
            if (!sq_play) ev_push(EV_ON, cur_trk, brush_note[cur_trk], 12, 0, 0);
        } else if (page == PG_SONG) {
            if (song_cur < prj.song_len) {
                prj.song[song_cur] = (uint8_t)clampi(prj.song[song_cur] + d, 0, NPAT - 1);
                ui_pat = prj.song[song_cur];
                touched();
            }
        } else
            pat_select(d);
    }
    for (i = 0; i < 4u; i++)
        if ((d = fm1_enc_take(ENC_KNOB1 + i)) != 0) {
            last_input_ms = fm1_ms;
            knob(i, d);
        }
    keys_input();
    while (1) {                                 /* USB-MIDI in plays the track under the cursor */
        uint8_t st, d1, d2;
        if (!midi_get(&st, &d1, &d2)) break;
        if ((st & 0xF0u) == 0x90u && d2) ev_push(EV_ON, cur_trk, IS_TONAL(cur_trk) ? d1 : 1u + d1 % 16u, 1u + d2 / 9u, 0, 0);
        else if ((st & 0xF0u) == 0x80u || (st & 0xF0u) == 0x90u) ev_push(EV_OFF, cur_trk, d1, 0, 0, 0);
    }
}

static void ui_leds(void)
{
    uint32_t i, k;
    static const uint8_t PAGE_BTN[] = {BTN_HOME, BTN_SEQ, BTN_EDIT, BTN_ENV, BTN_LFO, BTN_SEL, BTN_GLO, BTN_SAVE, BTN_FX, BTN_HOME, 255};
    for (i = 0; i < 41u; i++) led_want[i] = 0;
    for (i = 2; i < 12u; i++) led_want[i] = 1;   /* the page buttons glow, the one open is lit */
    if (PAGE_BTN[page] < 14u) led(PAGE_BTN[page], 2);
    led(BTN_PLAY, sq_play ? 2u : 1u);
    led(BTN_REC, rec ? ((fm1_ms / 300u) & 1u ? 2u : 1u) : 1u);
    led(BTN_OCT_DOWN, oct_ofs < 0 ? 2u : 1u);
    led(BTN_OCT_UP, oct_ofs > 0 ? 2u : 1u);
    switch (page) {
    case PG_GRID: {
        const pat_t *pt = P();
        uint32_t prow = sq_play && sq_pat == ui_pat ? sq_row : 0xFFu;
        for (i = 0; i < 16u; i++) {
            uint32_t r = grid_page * 16u + i;
            uint32_t lit = r < plen() && pt->c[r][cur_trk].note;
            if (r == prow) lit = !lit;
            led(KEY_LED(KEY_OF_WHITE[i]), lit ? 2u : (r < plen() ? 1u : 0u));
        }
        for (i = 0; i < 6u; i++) led(KEY_LED(KEY_OF_BLACK[i]), i == cur_trk ? 2u : 1u);
        break;
    }
    case PG_FX:
        for (i = 0; i < 16u; i++) led(KEY_LED(KEY_OF_WHITE[i]), (lfx_on >> (fx_bank * 16u + i) & 1u) ? 2u : 1u);
        for (i = 0; i < 6u; i++) led(KEY_LED(KEY_OF_BLACK[i]), ((prj.mute | live_mute) >> i & 1u) ? 2u : 1u);
        break;
    case PG_MAGIC:
        for (i = 0; i < 16u; i++) led(KEY_LED(KEY_OF_WHITE[i]), 1);
        for (i = 0; i < 6u; i++) led(KEY_LED(KEY_OF_BLACK[i]), i == cur_trk ? 2u : 1u);
        break;
    case PG_MIX:
        for (i = 0; i < 6u; i++) led(KEY_LED(KEY_OF_BLACK[i]), (prj.mute >> i & 1u) ? 2u : 1u);
        break;
    default:
        if (IS_TONAL(cur_trk) && prj.lock)      /* the scale's notes glow */
            for (k = 0; k < 27u; k++)
                if (in_scale(KEY0 + k)) led(KEY_LED(k), 1);
        for (k = 0; k < 27u; k++)
            if (fm1_in.notes >> k & 1u) led(KEY_LED(k), 2);
        break;
    }
    leds_flush();
}

/* ================================================================ the main loop */
static void app_init(void)
{
    uint32_t i;
    keys_init();
    for (i = 0; i <= 20u; i++) {                /* the gauge: 270 degrees from bottom left */
        uint32_t ph = 0x60000000u - i * (0xC0000000u / 20u);
        arc_x[i] = (int8_t)((sine(ph + 0x40000000u) * 13) >> 15);
        arc_y[i] = (int8_t)(-(sine(ph) * 13) >> 15);
    }
    make_peaks();
    if (settings_load(&set, sizeof set) == 0 && set.lang < LANG_N)
        lang = set.lang;
    else
        set.lang = lang;
    if (prj_load(0))
        prj_demo();                             /* nothing saved: the demo, ready to play */
    boot_ms = fm1_ms;
    last_input_ms = fm1_ms;
    g_force = 1;
}

static void app_step(void)
{
    ui_input();
    if (sq_play && prj.mode && page != PG_SONG)
        ui_pat = sq_pat;                        /* the song: the screen follows */
    if (cur_row >= plen())
        cur_row = 0;
    if (fm1_ms - ui_frame_ms >= 33u) {          /* ~30 frames a second, only what changed is sent */
        ui_frame_ms = fm1_ms;
        ui_leds();
        g_frame_send(draw_all);
    }
    if (set_dirty && !sq_play && quiet() && fm1_ms - set_ms > 2000u) {
        set_dirty = 0;                          /* the language (erasing stalls the sound: only when silent) */
        settings_save(&set, sizeof set);
    }
    if (dirty && !sq_play && quiet() && fm1_ms - dirty_ms > 8000u && fm1_ms - last_input_ms > 8000u) {
        prj_save(0);                            /* the autosave (erasing stalls the sound: only when silent) */
        toast("AUTO");
    }
}

static void app_main(void)
{
    app_init();
    for (;;) {
        platform_poll();
        app_step();
    }
}
