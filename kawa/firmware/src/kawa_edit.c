/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: what changes the project: new project and the demo, undo, the clipboard, the magic tools,
 * the store (five project slots in flash: 0 the autosave, 1..4 the user's). Main loop only. */

/* ---- sounds */
static void sound_preset(uint32_t t, uint32_t k)
{
    uint32_t e = TRK_ENGINE[t], i;
    const preset_t *pr;
    k %= NPRESETS_OF[e];
    pr = &PRESETS_OF[e][k];
    for (i = 0; i < NPARAM; i++)
        prj.snd[t].p[i] = pr->p[i];
    if (t == T_PU2)
        prj.snd[t].p[P_PAN] = 3;                /* the two pulses a little apart */
    if (t == T_PU1)
        prj.snd[t].p[P_PAN] = -2;
    prj.snd[t].preset = (uint8_t)k;
}

/* ---- the scale */
static int in_scale(uint32_t note)
{
    return (SCALES[prj.scale % 12u].mask >> ((note + 120u - prj.root) % 12u)) & 1u;
}
static uint32_t scale_step(uint32_t note, int32_t dir)   /* the next note of the scale up or down */
{
    int32_t n = (int32_t)note, k;
    for (k = 0; k < 12; k++) {
        n += dir;
        if (n < 12)
            return 12u;
        if (n > 119)
            return 119u;
        if (in_scale((uint32_t)n))
            return (uint32_t)n;
    }
    return (uint32_t)clampi(n, 12, 119);
}
static uint32_t scale_snap(uint32_t note)
{
    uint32_t k;
    for (k = 0; k < 12u; k++) {
        if (in_scale(note - k))
            return note - k;
        if (in_scale(note + k))
            return note + k;
    }
    return note;
}
static uint32_t scale_degree(int32_t deg, uint32_t base)   /* deg-th note of the scale from the root under base */
{
    uint32_t n = base - ((base + 120u - prj.root) % 12u);
    while (deg > 0) { n = scale_step(n, 1); deg--; }
    while (deg < 0) { n = scale_step(n, -1); deg++; }
    return n;
}

/* ---- new project, demo */
static void name_new(char *s)
{
    const char *a = NAME_A[rnd(8)], *b = NAME_B[rnd(8)];
    uint32_t i = 0;
    while (*a && i < 7u) s[i++] = *a++;
    s[i++] = ' ';
    while (*b && i < 14u) s[i++] = *b++;
    s[i] = 0;
}
static void pat_clear(pat_t *p)
{
    memset(p, 0, sizeof *p);
    p->len = 16;
}
static void prj_new(void)
{
    uint32_t i;
    memset(&prj, 0, sizeof prj);
    prj.magic = PRJ_MAGIC;
    prj.version = PRJ_VERSION;
    prj.bpm = 172;
    prj.swing = 50;
    prj.root = 9;                               /* A */
    prj.scale = 2;                              /* MINEUR */
    prj.lock = 1;
    prj.step = 1;
    prj.song_len = 1;
    for (i = 0; i < NPAT; i++)
        pat_clear(&prj.pat[i]);
    for (i = 0; i < NTRK; i++)
        sound_preset(i, TRK_PRESET0[i]);
    name_new(prj.name);
}

static void put(uint32_t p, uint32_t r, uint32_t t, uint32_t note, uint32_t vol, uint32_t fx, int32_t fxv)
{
    cell_t *c = &prj.pat[p].c[r][t];
    c->note = (uint8_t)note;
    c->vol = (uint8_t)vol;
    c->fx = (uint8_t)fx;
    c->fxv = (uint8_t)fxv;
}
static void put_row(uint32_t p, uint32_t t, const uint8_t *notes, uint32_t vol)
{
    uint32_t r;
    for (r = 0; r < 16u; r++)
        if (notes[r])
            put(p, r, t, notes[r], vol, 0, 0);
}

/* the demo: four patterns of breakcore in A minor at 172, chained 1 1 2 3 2 3 4 3 */
static void prj_demo(void)
{
    static const uint8_t BASS[4][16] = {
        {45, 0, 0, 45, 0, 0, 57, 0, 41, 0, 0, 41, 43, 0, 55, 0},
        {45, 0, 57, 45, 0, 45, 57, 0, 41, 0, 53, 41, 43, 0, 43, 55},
        {45, 0, 57, 45, 0, 45, 57, 0, 41, 0, 53, 41, 43, 0, 43, 55},
        {45, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0}};
    static const uint8_t LEAD2[16] = {76, 0, 74, 0, 72, 0, 69, 0, 72, 0, 74, 0, 76, 0, 79, 77};
    static const uint8_t LEAD3[16] = {81, 0, 79, 76, 0, 74, 76, 0, 72, 0, 69, 72, 74, 0, 0, 0};
    static const uint8_t COUNTER[16] = {0, 81, 0, 84, 0, 81, 0, 88, 0, 77, 0, 81, 0, 79, 0, 83};
    static const uint8_t HATS[16] = {0, 0, 96, 0, 0, 0, 96, 0, 0, 0, 96, 0, 0, 96, 96, 96};
    static const uint8_t CHOP2[16] = {1, 2, 3, 4, 5, 5, 7, 8, 1, 10, 11, 12, 13, 13, 15, 16};
    static const uint8_t CHOP3[16] = {1, 2, 1, 2, 5, 6, 7, 8, 3, 4, 11, 12, 13, 14, 13, 16};
    uint32_t p, r;
    prj_new();
    memcpy(prj.name, "DEMO KAWA", 10);
    for (p = 0; p < 4u; p++)
        put_row(p, T_ONDE, BASS[p], 13);
    put(0, 0, T_PU1, 69, 11, FX_ARP, 1);        /* chip chords: A minor, F, G */
    put(0, 3, T_PU1, NOTE_OFF, 0, 0, 0);
    put(0, 6, T_PU1, 69, 9, FX_ARP, 1);
    put(0, 8, T_PU1, 65, 11, FX_ARP, 0);
    put(0, 11, T_PU1, NOTE_OFF, 0, 0, 0);
    put(0, 12, T_PU1, 67, 11, FX_ARP, 0);
    put_row(1, T_PU1, LEAD2, 12);
    put(1, 14, T_PU1, 79, 12, FX_VIB, 6);
    put_row(2, T_PU1, LEAD3, 12);
    put(2, 2, T_PU1, 76, 12, FX_GLIDE, 9);
    put(2, 12, T_PU1, 74, 12, FX_VIB, 8);
    put_row(1, T_PU2, COUNTER, 8);
    put_row(2, T_PU2, COUNTER, 8);
    put(3, 0, T_PU2, 69, 10, FX_ARP, 7);
    put(3, 8, T_PU2, 65, 10, FX_ARP, 6);
    put(3, 12, T_PU2, 67, 10, FX_ARP, 5);
    for (p = 1; p < 3u; p++) {
        put_row(p, T_BRUIT, HATS, 9);
        put(p, 0, T_KIT, 2, 15, 0, 0);          /* GABBER */
        put(p, 3, T_KIT, 2, 12, 0, 0);
        put(p, 6, T_KIT, 2, 14, 0, 0);
        put(p, 10, T_KIT, 2, 14, 0, 0);
    }
    put(2, 4, T_KIT, 4, 12, 0, 0);              /* CLAP */
    put(2, 12, T_KIT, 4, 12, 0, 0);
    put(2, 15, T_KIT, 2, 13, FX_ROLL, 2);
    for (r = 0; r < 16u; r++)
        put(0, r, T_CASSE, r + 1u, 13, 0, 0);   /* the break, straight */
    put_row(1, T_CASSE, CHOP2, 13);
    put(1, 13, T_CASSE, 13, 13, FX_ROLL, 1);
    put_row(2, T_CASSE, CHOP3, 13);
    put(2, 8, T_CASSE, 3, 13, FX_REV, 0);
    put(2, 15, T_CASSE, 16, 13, FX_ROLL, 4);
    put(3, 0, T_CASSE, 1, 12, 0, 0);
    put(3, 4, T_CASSE, 5, 10, FX_PITCH, -12);
    put(3, 12, T_CASSE, 13, 12, FX_ROLL, 3);
    prj.pat[2].live[14] = LF_LOOP32 + 1u;       /* live effects, recorded */
    prj.pat[2].live[15] = LF_LOOP64 + 1u;
    for (r = 12; r < 16u; r++)
        prj.pat[3].live[r] = LF_LPF + 1u;
    {
        static const uint8_t SONG[8] = {0, 0, 1, 2, 1, 2, 3, 2};
        memcpy(prj.song, SONG, 8);
        prj.song_len = 8;
    }
    prj.mode = 1;
}

/* ---- undo: the last edits of patterns (SAVE held puts the last one back) */
#define NUNDO 6u
static pat_t undo_pat[NUNDO];
static uint8_t undo_idx[NUNDO], undo_n, undo_top;
static uint32_t undo_pat_last = 0xFFu, undo_ms_last;
static uint8_t dirty;                           /* changed since the last save */
static uint32_t dirty_ms;
static void touched(void)
{
    dirty = 1;
    dirty_ms = fm1_ms;
}
static void undo_push_merge(uint32_t p, int merge)   /* before an edit of pattern p; merge: knob turns and notes */
{                                                       /* typed within 1.5 s of the last edit are one step */
    if (merge && p == undo_pat_last && fm1_ms - undo_ms_last < 1500u) {
        undo_ms_last = fm1_ms;
        touched();
        return;
    }
    undo_pat[undo_top] = prj.pat[p];
    undo_idx[undo_top] = (uint8_t)p;
    undo_top = (uint8_t)((undo_top + 1u) % NUNDO);
    if (undo_n < NUNDO)
        undo_n++;
    undo_pat_last = merge ? p : 0xFFu;
    undo_ms_last = fm1_ms;
    touched();
}
static void undo_push(uint32_t p) { undo_push_merge(p, 0); }   /* a step of its own */
static int undo_pop(void)                       /* the pattern put back, or -1 */
{
    uint32_t p;
    if (!undo_n)
        return -1;
    undo_top = (uint8_t)((undo_top + NUNDO - 1u) % NUNDO);
    undo_n--;
    p = undo_idx[undo_top];
    prj.pat[p] = undo_pat[undo_top];
    undo_pat_last = 0xFFu;
    touched();
    return (int)p;
}

/* ---- the clipboard: a track's rows, or a whole pattern */
static pat_t clip_pat;
static cell_t clip_lane[NROW];
static uint8_t clip_kind, clip_len, clip_trk;   /* 0 empty, 1 a track, 2 a pattern */

/* ---- the magic tools: on the track (PISTE) or on the whole pattern (MOTIF) */
static uint32_t brush_note[NTRK] = {69, 76, 45, 96, 1, 1};   /* the note the tools and the grid write */
static uint32_t lane_base(uint32_t t)            /* a track's home octave */
{
    static const uint8_t B[NTRK] = {69, 76, 45, 96, 1, 1};
    return B[t];
}

static void mg_chop(pat_t *p, uint32_t t, uint32_t inten)
{
    uint32_t r, len = p->len, brk = (uint32_t)clampi(prj.snd[T_CASSE].p[P_BRK], 0, BRK_N - 1);
    if (t == T_CASSE) {
        for (r = 0; r < len; r++) {
            uint32_t s = r % 16u, k, pick = s;
            cell_t *c = &p->c[r][t];
            if ((r % 8u) == 0u)
                pick = (r % 16u) == 0u ? 0u : 8u;           /* the downbeats keep a kick */
            else if ((r % 8u) == 4u) {
                for (k = 0; k < 16u; k++) {                 /* a snare on 2 and 4 */
                    uint32_t q = (r + k * 5u) % 16u;
                    if (BRK_TAG[brk][q] & 2u) { pick = q; break; }
                }
            } else if (rnd(16) < inten)
                pick = rnd(16);
            c->note = (uint8_t)(pick + 1u);
            c->vol = (uint8_t)(r % 4u ? 12u : 14u);
            c->fx = 0;
            c->fxv = 0;
            if ((r % 8u) == 7u && rnd(24) < inten) { c->fx = FX_ROLL; c->fxv = (uint8_t)rnd(5); }
            else if (rnd(40) < inten) { c->fx = FX_REV; }
            else if (rnd(56) < inten) { c->fx = FX_PITCH; c->fxv = (uint8_t)(int8_t)(rnd(2) ? 12 : -5); }
        }
        if (inten > 10u && len >= 4u) {                     /* a roll into the next bar */
            p->c[len - 1u][t].fx = FX_ROLL;
            p->c[len - 1u][t].fxv = (uint8_t)(3u + rnd(3));
        }
        return;
    }
    for (r = 0; r + 4u <= len; r += 4u) {                   /* other tracks: shuffle beats of 4 rows */
        if (rnd(16) < inten) {
            uint32_t a = rnd(len / 4u) * 4u, k;
            for (k = 0; k < 4u; k++) {
                cell_t x = p->c[r + k][t];
                p->c[r + k][t] = p->c[a + k][t];
                p->c[a + k][t] = x;
            }
        }
    }
}

static void mg_beat(pat_t *p, uint32_t t, uint32_t inten)
{
    uint32_t r, len = p->len;
    for (r = 0; r < len; r++)
        p->c[r][t].note = p->c[r][t].fx = p->c[r][t].fxv = 0;
    if (t == T_KIT) {                           /* low: four on the floor; mid: broken; high: gabber */
        uint32_t kick = inten > 10u ? 2u : 1u;
        for (r = 0; r < len; r++) {
            cell_t *c = &p->c[r][t];
            uint32_t b = r % 16u;
            int hit = 0;
            if (inten < 5u) hit = b % 4u == 0u;
            else if (inten < 11u) hit = b == 0u || b == 6u || b == 10u || (b == 13u && rnd(2));
            else hit = b % 4u == 0u || b == 3u || b == 6u || b == 10u || b == 14u || rnd(6) == 0u;
            if (hit) { c->note = (uint8_t)kick; c->vol = (uint8_t)(b % 4u ? 12u : 15u); }
            else if ((b == 4u || b == 12u) && inten >= 3u) { c->note = 3; c->vol = 13; }   /* CAISSE */
            else if (inten >= 7u && rnd(6) == 0u) { c->note = 5; c->vol = 7; }             /* a hat */
        }
        if (inten > 8u) { p->c[len - 1u][t].note = 3; p->c[len - 1u][t].vol = 12; p->c[len - 1u][t].fx = FX_ROLL; p->c[len - 1u][t].fxv = 2; }
        return;
    }
    if (t == T_CASSE) {
        mg_chop(p, t, inten);
        return;
    }
    for (r = 0; r < len; r++) {                 /* the noise: hats; the others: a rhythm on the brush note */
        cell_t *c = &p->c[r][t];
        int hit = t == T_BRUIT ? ((r % 2u) == 1u || rnd(16) < inten) : (r % 4u == 0u || rnd(24) < inten);
        if (hit) {
            c->note = (uint8_t)brush_note[t];
            c->vol = (uint8_t)(r % 2u ? 8u + rnd(4) : 11u);
            if (t == T_BRUIT && rnd(24) < inten) { c->fx = FX_ROLL; c->fxv = (uint8_t)rnd(3); }
        }
    }
}

static void mg_melo(pat_t *p, uint32_t t, uint32_t inten, int bass)
{
    uint32_t r, len = p->len, base = bass ? 45u : lane_base(t), n;
    int32_t deg = 0;
    if (!IS_TONAL(t)) {
        mg_beat(p, t, inten);
        return;
    }
    if (t == T_ONDE && !bass)
        base = 57u;
    if (t == T_BRUIT)
        base = 96u;
    n = scale_snap(base);
    for (r = 0; r < len; r++) {
        cell_t *c = &p->c[r][t];
        uint32_t dens = bass ? (r % 4u == 0u ? 16u : 4u + inten / 2u) : 5u + inten;
        c->fx = c->fxv = 0;
        if (r && rnd(20) >= dens) {             /* a rest (the first row always plays) */
            c->note = (bass || rnd(3)) ? 0u : NOTE_OFF;
            c->vol = 0;
            continue;
        }
        if (bass) {
            static const int8_t STEPS[6] = {0, 0, 4, 7, 3, 5};
            deg = STEPS[rnd(6)];
            c->note = (uint8_t)(rnd(4) ? scale_degree(deg, n) : scale_degree(deg, n) + 12u);
        } else {
            deg += (int32_t)rnd(5) - 2;
            deg = clampi(deg, -4, 9);
            c->note = (uint8_t)scale_degree(deg, n);
            if (rnd(30) < inten) { c->fx = FX_ARP; c->fxv = (uint8_t)(in_scale(c->note + 4u) ? 0u : 1u); }
            else if (rnd(40) < inten) { c->fx = FX_GLIDE; c->fxv = 8; }
            else if (rnd(50) < inten) { c->fx = FX_VIB; c->fxv = 6; }
        }
        c->vol = (uint8_t)(r % 4u ? 11u : 13u);
    }
}

static void mg_arp(pat_t *p, uint32_t t)
{
    uint32_t r;
    for (r = 0; r < p->len; r++) {
        cell_t *c = &p->c[r][t];
        if (c->note && c->note != NOTE_OFF && IS_TONAL(t)) {
            c->fx = FX_ARP;
            c->fxv = in_scale(c->note + 4u) ? 0u : in_scale(c->note + 3u) ? 1u : 3u;
        }
    }
}

static void mg_eucl(pat_t *p, uint32_t t, uint32_t inten, uint32_t rot)
{
    uint32_t r, len = p->len, k = 1u + inten * len / 16u, acc = 0;
    if (k > len) k = len;
    for (r = 0; r < len; r++) {
        cell_t *c = &p->c[(r + rot) % len][t];
        acc += k;
        c->fx = c->fxv = 0;
        if (acc >= len) {
            acc -= len;
            c->note = (uint8_t)brush_note[t];
            c->vol = 12;
        } else
            c->note = 0;
    }
}

static void mg_vary(pat_t *p, uint32_t t, uint32_t inten)
{
    uint32_t r, len = p->len;
    for (r = 0; r < len; r++) {
        cell_t *c = &p->c[r][t];
        if (rnd(32) >= inten + 2u)
            continue;
        switch (rnd(4)) {
        case 0:                                 /* another note near it */
            if (c->note && c->note != NOTE_OFF) {
                if (IS_TONAL(t)) c->note = (uint8_t)scale_step(c->note, rnd(2) ? 1 : -1);
                else c->note = (uint8_t)(1u + (cell_idx(c->note) + 1u + rnd(15)) % 16u);
            }
            break;
        case 1: {                               /* trade with a neighbour */
            uint32_t q = (r + 1u) % len;
            cell_t x = *c;
            *c = p->c[q][t];
            p->c[q][t] = x;
            break;
        }
        case 2:                                 /* a trick */
            if (c->note && c->note != NOTE_OFF && !c->fx) {
                static const uint8_t PICK[5] = {FX_ROLL, FX_VIB, FX_BEND, FX_CHANCE, FX_ARP};
                c->fx = PICK[rnd(5)];
                c->fxv = (uint8_t)FXD[c->fx].def;
                if (!IS_TONAL(t) && c->fx != FX_ROLL && c->fx != FX_CHANCE) c->fx = FX_ROLL, c->fxv = 1;
            }
            break;
        default:                                /* volume */
            if (c->note) c->vol = (uint8_t)clampi((int32_t)c->vol + (int32_t)rnd(7) - 3, 3, 15);
            break;
        }
    }
}

static void mg_rolls(pat_t *p, uint32_t t, uint32_t inten)
{
    uint32_t r, len = p->len;
    for (r = 3; r < len; r += 4u) {
        cell_t *c = &p->c[r][t];
        if (rnd(16) > inten && r != len - 1u)
            continue;
        if (!c->note)
            c->note = (uint8_t)(t >= T_KIT ? (t == T_CASSE ? 13u : 3u) : brush_note[t]), c->vol = 12;
        c->fx = FX_ROLL;
        c->fxv = (uint8_t)(r == len - 1u ? 3u + rnd(4) : rnd(3));
    }
}

static void lane_apply(uint32_t tool, pat_t *p, uint32_t t, uint32_t inten, uint32_t seed)
{
    uint32_t r, len = p->len;
    switch (tool) {
    case MG_CHOP: mg_chop(p, t, inten); break;
    case MG_BEAT: mg_beat(p, t, inten); break;
    case MG_MELO: mg_melo(p, t, inten, 0); break;
    case MG_BASS: mg_melo(p, t, inten, 1); break;
    case MG_ARP: mg_arp(p, t); break;
    case MG_EUCL: mg_eucl(p, t, inten, seed % (len ? len : 1u)); break;
    case MG_VARY: mg_vary(p, t, inten); break;
    case MG_ROLLS: mg_rolls(p, t, inten); break;
    case MG_NUANCE:
        for (r = 0; r < len; r++)
            if (p->c[r][t].note && p->c[r][t].note != NOTE_OFF)
                p->c[r][t].vol = (uint8_t)clampi(r % 4u == 0u ? 15 : r % 2u ? 8 + (int32_t)rnd(1u + inten / 3u) : 12, 1, 15);
        break;
    case MG_SHIFT: {
        cell_t last = p->c[len - 1u][t];
        for (r = len - 1u; r > 0u; r--)
            p->c[r][t] = p->c[r - 1u][t];
        p->c[0][t] = last;
        break;
    }
    case MG_REVERSE:
        for (r = 0; r < len / 2u; r++) {
            cell_t x = p->c[r][t];
            p->c[r][t] = p->c[len - 1u - r][t];
            p->c[len - 1u - r][t] = x;
        }
        break;
    case MG_TRANSP:
        for (r = 0; r < len; r++) {
            cell_t *c = &p->c[r][t];
            if (!c->note || c->note == NOTE_OFF) continue;
            if (IS_TONAL(t)) c->note = (uint8_t)(prj.lock ? scale_step(c->note, 1) : (c->note < 119u ? c->note + 1u : c->note));
            else c->note = (uint8_t)(1u + (cell_idx(c->note) + 1u) % 16u);
        }
        break;
    case MG_CLEAR:
        for (r = 0; r < NROW; r++)
            memset(&p->c[r][t], 0, sizeof(cell_t));
        break;
    }
}

/* one tool, on the track or the pattern; returns a word for the screen */
static const char *magic_run(uint32_t tool, uint32_t pi, uint32_t t, uint32_t scope_all, uint32_t inten, uint32_t seed)
{
    pat_t *p = &prj.pat[pi];
    uint32_t k;
    rnd_main ^= seed * 0x9E3779B1u + fm1_ms;
    if (!rnd_main)
        rnd_main = 1;
    if (tool == MG_COPY) {
        if (scope_all) { clip_pat = *p; clip_kind = 2; }
        else {
            for (k = 0; k < NROW; k++) clip_lane[k] = p->c[k][t];
            clip_kind = 1;
            clip_len = p->len;
            clip_trk = (uint8_t)t;
        }
        return TR("COPIE", "COPIED", "COPIADO");
    }
    undo_push(pi);                              /* each tool its own undo step */
    if (tool == MG_PASTE) {
        if (clip_kind == 2) *p = clip_pat;
        else if (clip_kind == 1)
            for (k = 0; k < NROW; k++) p->c[k][t] = clip_lane[k];
        else return TR("VIDE", "EMPTY", "VACIO");
        return TR("COLLE", "PASTED", "PEGADO");
    }
    if (tool == MG_DOUBLE) {
        uint32_t len = p->len, r, tt;
        if (len > 16u) return "MAX 32";
        for (r = 0; r < len; r++)
            for (tt = 0; tt < NTRK; tt++)
                if (scope_all || tt == t) p->c[r + len][tt] = p->c[r][tt];
        for (r = 0; r < len && scope_all; r++) p->live[r + len] = p->live[r];
        p->len = (uint8_t)(len * 2u);
        return "X2";
    }
    if (!scope_all) {
        lane_apply(tool, p, t, inten, seed);
        return "OK";
    }
    for (k = 0; k < NTRK; k++) {                /* the whole pattern: each track gets what suits it */
        uint32_t tl = tool;
        if (tool == MG_MELO && (k == T_ONDE)) tl = MG_BASS;
        if ((tool == MG_MELO || tool == MG_BASS) && k >= T_BRUIT) tl = MG_BEAT;
        if (tool == MG_BASS && k < T_ONDE) continue;
        if (tool == MG_BEAT && k < T_BRUIT) continue;
        if (tool == MG_CHOP && k != T_CASSE) continue;
        if (tool == MG_ARP && k >= T_ONDE) continue;
        if (tool == MG_TRANSP && !IS_TONAL(k)) continue;
        if (tool == MG_EUCL && k != t) continue;
        lane_apply(tl, p, k, inten, seed + k);
    }
    if (tool == MG_CLEAR)
        memset(p->live, 0, sizeof p->live);
    return "OK";
}

/* ---- the store: slots of 28 KiB from STORE_LO; [project_t with its CRC] */
#define SLOT_SIZE 0x7000u
#define NSLOT 5u
static uint32_t slot_at(uint32_t k) { return STORE_LO + k * SLOT_SIZE; }

#if defined(DINGHY_HOST) || defined(KAWA_WASM)
static uint8_t host_flash[NSLOT][SLOT_SIZE];
static int store_read(uint32_t k, uint32_t off, void *p, uint32_t n) { memcpy(p, host_flash[k] + off, n); return 0; }
static int store_write(uint32_t k, const void *p, uint32_t n) { memcpy(host_flash[k], p, n); return 0; }
#else
static int store_read(uint32_t k, uint32_t off, void *p, uint32_t n) { return st_read(slot_at(k) + off, p, n); }
static int store_write(uint32_t k, const void *p, uint32_t n)
{
    uint32_t a = slot_at(k), s, took;
    int rc;
    if (!flash_ok)
        return -1;
    for (s = 0; s < SLOT_SIZE; s += 0x1000u)
        if ((rc = fl_erase4k(a + s, &took)) != 0)
            return rc;
    if ((rc = fl_write(a + 8u, (const uint8_t *)p + 8u, n - 8u)) != 0)   /* the magic last: a cut save stays invalid */
        return rc;
    return fl_write(a, (const uint8_t *)p, 8u);
}
#endif

static uint32_t crc_step(uint32_t c, const uint8_t *p, uint32_t n)
{
    uint32_t k;
    while (n--) {
        c ^= *p++;
        for (k = 0; k < 8u; k++)
            c = c & 1u ? (c >> 1) ^ 0xEDB88320u : c >> 1;
    }
    return c;
}
static uint32_t prj_crc(const project_t *p)
{
    return ~crc_step(0xFFFFFFFFu, (const uint8_t *)p, (uint32_t)((const uint8_t *)&p->crc - (const uint8_t *)p));
}

static int prj_save(uint32_t k)
{
    prj.magic = PRJ_MAGIC;
    prj.version = PRJ_VERSION;
    prj.crc = prj_crc(&prj);
    if (store_write(k, &prj, sizeof prj))
        return -1;
    dirty = 0;
    return 0;
}

static int slot_valid(uint32_t k, char *name)   /* the slot holds a project (its name into name, 16 B) */
{
    uint32_t h[2], c = 0xFFFFFFFFu, off;
    uint8_t buf[256];
    const uint32_t body = (uint32_t)((uint8_t *)&prj.crc - (uint8_t *)&prj), crc_at = body;
    uint32_t crc;
    if (store_read(k, 0, h, 8) || h[0] != PRJ_MAGIC || h[1] != PRJ_VERSION)
        return 0;
    for (off = 0; off < body; off += 256u) {    /* the CRC by pieces: no second copy of the project in RAM */
        uint32_t n = body - off < 256u ? body - off : 256u;
        if (store_read(k, off, buf, n))
            return 0;
        c = crc_step(c, buf, n);
        if (off == 0u && name)
            memcpy(name, buf + 8, 16);
    }
    if (store_read(k, crc_at, &crc, 4))
        return 0;
    return ~c == crc;
}

static int prj_load(uint32_t k)
{
    if (!slot_valid(k, 0))
        return -1;
    if (store_read(k, 0, &prj, sizeof prj))
        return -1;
    dirty = 0;
    undo_n = 0;
    return 0;
}
