/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the sequencer and the audio interrupt's entry (app_audio).
 *
 * Rows are 16ths. A row's phase is a 32-bit counter that wraps once per row (swing: even rows longer).
 * In a row, per track: RETARD starts the note later, ROULE plays it again 2..32 times, COUPE stops it,
 * CHANCE may skip it. The LIVE lane of the pattern adds its effect on its rows, as if its key were held.
 * Loop mode plays the pattern on the screen (a new one starts at the end of the one playing); song mode
 * plays the song's list. */

static uint32_t s_phase, s_inc_even = 1117000u, s_inc_odd = 1117000u, s_len_even = 3845u, s_len_odd = 3845u;
static uint8_t s_pat, s_row, s_pos, s_again_row;
static uint16_t s_bpm;
static uint8_t s_swing, s_trip, s_again;
static struct {
    uint8_t note, vol, fx, fxv, pending, roll_n, roll_k, cut, suppress;
    uint16_t delay16;
} st[NTRK];
static uint8_t last_note[NTRK];                 /* the note each track played last (ROULE on an empty cell) */
static volatile uint8_t sq_suppress[NTRK];      /* main: the note of the next row is already sounding (live take) */

static void seq_tempo(void)                     /* row lengths from the tempo and the swing */
{
    uint32_t base, sw;
    s_bpm = prj.bpm < 40u ? 40u : prj.bpm > 300u ? 300u : prj.bpm;
    s_swing = prj.swing;
    sw = s_swing < 50u ? 50u : s_swing > 75u ? 75u : s_swing;
    if (s_trip && sw < 67u)
        sw = 67u;                               /* 6/8: the second 16th of each pair comes late, as a triplet */
    base = 661500u / s_bpm;                     /* 44100 * 60 / 4 */
    s_len_even = 2u * base * sw / 100u;
    s_len_odd = 2u * base - s_len_even;
    s_inc_even = 0xFFFFFFFFu / s_len_even;
    s_inc_odd = 0xFFFFFFFFu / s_len_odd;
    g_rowlen = base;
}

static void seq_play_cell(uint32_t t, uint32_t note, uint32_t vol, uint32_t fx, uint32_t fxv)
{
    if (note != NOTE_OFF)
        last_note[t] = (uint8_t)note;
    voice_on(t, note, vol, fx, fxv, g_rowlen / 6u);
}

static void seq_row_start(void)
{
    const pat_t *pt = &prj.pat[s_pat];
    uint32_t t;
    for (t = 0; t < NTRK; t++) {
        const cell_t *c = &pt->c[s_row][t];
        st[t].note = c->note;
        st[t].vol = c->vol;
        st[t].fx = c->fx;
        st[t].fxv = c->fxv;
        st[t].pending = 0;
        st[t].roll_n = 0;
        st[t].cut = 0;
        if (c->fx == FX_CUT)
            st[t].cut = (uint8_t)((c->fxv * 256u) / 24u);
        if (c->note == NOTE_NONE) {
            if (c->fx == FX_ROLL && last_note[t]) {          /* a roll on an empty cell: the last note again */
                st[t].note = last_note[t];
                st[t].vol = c->vol ? c->vol : 12u;
                st[t].roll_n = ROLL_N[c->fxv < 9u ? c->fxv : 8u];
                st[t].roll_k = 1;
                seq_play_cell(t, st[t].note, st[t].vol, FX_NONE, 0);
            }
            continue;
        }
        if (sq_suppress[t]) {                   /* played live a moment ago: do not play it twice */
            sq_suppress[t] = 0;
            continue;
        }
        if (c->fx == FX_CHANCE && (xr(&rnd_isr) >> 8) % 10u >= c->fxv)
            continue;
        if (c->fx == FX_DELAY) {
            st[t].pending = 1;
            st[t].delay16 = (uint16_t)((c->fxv * 65536u) / 24u);
            continue;
        }
        if (c->fx == FX_ROLL && c->note != NOTE_OFF) {
            st[t].roll_n = ROLL_N[c->fxv < 9u ? c->fxv : 8u];
            st[t].roll_k = 1;
        }
        seq_play_cell(t, c->note, c->vol, c->fx, c->fxv);
    }
}

static void seq_start(void)
{
    s_pat = sq_start_pat < NPAT ? sq_start_pat : 0u;
    s_pos = sq_start_pos;
    if (prj.mode && prj.song_len) {
        if (s_pos >= prj.song_len)
            s_pos = 0;
        s_pat = prj.song[s_pos] < NPAT ? prj.song[s_pos] : 0u;
    }
    s_row = 0;
    s_phase = 0;
    s_again = 0;
    seq_tempo();
    sq_pat = s_pat;
    sq_row = 0;
    sq_songpos = s_pos;
    sq_play = 1;
    seq_row_start();
    sq_rowtick++;
}

static void seq_next_row(void)
{
    uint32_t len = prj.pat[s_pat].len;
    if (!len || len > NROW)
        len = 16u;
    s_row++;
    if (s_again && (s_row & 3u) == 0u)          /* RELANCE: the same beat again */
        s_row = s_again_row;
    if (s_row >= len) {                         /* the end of the pattern */
        s_row = 0;
        if (prj.mode && prj.song_len) {
            if (++s_pos >= prj.song_len)
                s_pos = 0;
            s_pat = prj.song[s_pos] < NPAT ? prj.song[s_pos] : 0u;
        } else if (sq_next < NPAT) {
            s_pat = sq_next;
            sq_next = 0xFF;
        }
        sq_songpos = s_pos;
    }
    sq_pat = s_pat;
    sq_row = s_row;
    if (rec_live && lfx_keys) {                 /* recording the live effects into the LIVE lane */
        uint32_t id = 0;
        while (id < LF_N && !(lfx_keys >> id & 1u))
            id++;
        if (id < LF_N)
            prj.pat[s_pat].live[s_row] = (uint8_t)(id + 1u);
    }
    seq_row_start();
    sq_rowtick++;
}

static void seq_chunk(void)
{
    uint32_t t, old = s_phase, f16, cur_len;
    s_phase += (s_row & 1u ? s_inc_odd : s_inc_even) * CHUNK;
    if (s_phase < old)
        seq_next_row();
    sq_frac = s_phase;
    f16 = s_phase >> 16;
    for (t = 0; t < NTRK; t++) {                /* inside the row: late notes, rolls, cuts */
        if (st[t].pending && f16 >= st[t].delay16) {
            st[t].pending = 0;
            seq_play_cell(t, st[t].note, st[t].vol, st[t].fx == FX_DELAY ? FX_NONE : st[t].fx, st[t].fxv);
        }
        if (st[t].roll_n && st[t].roll_k < st[t].roll_n && f16 >= (st[t].roll_k * 65536u) / st[t].roll_n) {
            st[t].roll_k++;
            seq_play_cell(t, st[t].note, st[t].vol, FX_NONE, 0);
        }
        if (st[t].cut && (f16 >> 8) >= st[t].cut) {
            st[t].cut = 0;
            if (t < 4u)
                voice_off(t);
            else if (t == T_CASSE) {
                brkv[0].gtgt = brkv[1].gtgt = 0;
                brkv[0].gstep = brkv[1].gstep = -(32767 / 120);
            } else
                drum[0].aek = drum[1].aek = drum[0].nek = drum[1].nek = 50000;
        }
    }
    cur_len = s_row & 1u ? s_len_odd : s_len_even;
    g_beatpos = (s_row & 3u) * g_rowlen + ((f16 * cur_len) >> 16);
}

/* ---- the audio interrupt: 256 frames, stereo, Q15, out is zero */
static void app_audio(int32_t *out, uint32_t n)
{
    uint32_t c, i, t, t0 = fm1_ticks(), on;
    uint16_t peak[NTRK] = {0};
    while (evq_r != evq_w) {                    /* the keys */
        const ev_t *e = &evq[evq_r % EVQ];
        if (e->type == EV_ON)
            seq_play_cell(e->trk, e->note, e->vol, e->fx, e->fxv);
        else if (e->type == EV_OFF) {
            if (e->trk < 4u && tone[e->trk].note == e->note)
                voice_off(e->trk);
        } else if (e->type == EV_ALLOFF)
            voices_silence();
        evq_r++;
    }
    if (sq_req == 1u) {
        sq_req = 0;
        seq_start();
    } else if (sq_req == 2u) {
        sq_req = 0;
        sq_play = 0;
        voices_silence();
        s_again = 0;
    }
    if (prj.bpm != s_bpm || prj.swing != s_swing || s_trip != (uint8_t)(lfx_on >> LF_TRIP & 1u)) {
        s_trip = (uint8_t)(lfx_on >> LF_TRIP & 1u);
        seq_tempo();
    }
    on = lfx_keys;
    if (sq_play && prj.pat[s_pat].live[s_row] && prj.pat[s_pat].live[s_row] <= LF_N)
        on |= 1u << (prj.pat[s_pat].live[s_row] - 1u);
    if ((on >> LF_AGAIN & 1u) && !s_again && sq_play) {
        s_again = 1;
        s_again_row = (uint8_t)(s_row & ~3u);
    } else if (!(on >> LF_AGAIN & 1u))
        s_again = 0;
    fx_block(on);
    for (c = 0; c < n; c += CHUNK) {
        int32_t L[CHUNK], R[CHUNK], E[CHUNK], mono[CHUNK];
        if (sq_play)
            seq_chunk();
        else
            g_beatpos = (g_beatpos + CHUNK) % (g_rowlen * 4u);
        for (i = 0; i < CHUNK; i++)
            L[i] = R[i] = E[i] = 0;
        for (t = 0; t < NTRK; t++) {
            const int8_t *p = prj.snd[t].p;
            int32_t gl = PAN_G[clampi(p[P_PAN], -7, 7) + 7][0], gr = PAN_G[clampi(p[P_PAN], -7, 7) + 7][1];
            int32_t send = clampi(p[P_ECHO], 0, 15) * 1300;
            uint32_t pk = peak[t];
            for (i = 0; i < CHUNK; i++)
                mono[i] = 0;
            if (t < 4u)
                tone_chunk(t, mono);
            else if (t == T_KIT) {
                drum_chunk(&drum[0], mono);
                drum_chunk(&drum[1], mono);
            } else {
                brk_chunk(&brkv[0], mono);
                brk_chunk(&brkv[1], mono);
            }
            for (i = 0; i < CHUNK; i++) {
                int32_t m = mono[i], a = m < 0 ? -m : m;
                if ((uint32_t)a > pk)
                    pk = (uint32_t)a;
                L[i] += (m * gl) >> 12;
                R[i] += (m * gr) >> 12;
                E[i] += (m * send) >> 15;
            }
            peak[t] = (uint16_t)(pk > 65535u ? 65535u : pk);
        }
        fx_chunk(L, R, E);
        for (i = 0; i < CHUNK; i++) {
            out[2u * (c + i)] += L[i];
            out[2u * (c + i) + 1u] += R[i];
        }
    }
    for (t = 0; t < NTRK; t++)
        level[t] = peak[t];
    audio_us = (fm1_ticks() - t0) / FM1_TICKS_PER_US;
}
