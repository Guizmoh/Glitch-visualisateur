/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the voices. Runs in the audio interrupt: integers only, no division per frame.
 *
 *   CARRE 1, 2  pulse waves 12 / 25 / 50 / 75 % or PWM, band-limited (polyBLEP)
 *   ONDE        a 32-step 4-bit wave table (Game Boy style), stepped as the real thing
 *   BRUIT       a 15-bit LFSR (NES style), LONG or METAL (93 steps), clocked by the note
 *   KIT         16 synthesised drums, two voices
 *   CASSE       a breakbeat cut in 16 slices (the white keys), two voices crossfading
 *
 * Every track: ADSR (KIT and CASSE: their own shapes), pitch sweep, vibrato, bit crush, a one-pole
 * TON filter, pan and an echo send. Control (envelopes, pitch) runs once per chunk of 16 frames. */

static const uint32_t INC_C9[12] = {            /* MIDI 120..131 (C9..B9): f * 2^32 / 44100; lower octaves shift right */
    815363807u, 863847862u, 915214929u, 969636441u, 1027294024u, 1088380105u,
    1153098554u, 1221665363u, 1294309365u, 1371273005u, 1452813141u, 1539201906u};
static const uint32_t SEMI_Q16[25] = {          /* 2^(k/12), k = 0..24, Q16 */
    65536u, 69433u, 73562u, 77936u, 82570u, 87480u, 92682u, 98193u, 104032u, 110218u, 116772u, 123715u,
    131072u, 138866u, 147123u, 155872u, 165140u, 174959u, 185364u, 196386u, 208064u, 220436u, 233544u, 247431u, 262144u};
static const uint32_t SEMI_INV_Q16[25] = {      /* 2^(-k/12), Q16 */
    65536u, 61858u, 58386u, 55109u, 52016u, 49097u, 46341u, 43740u, 41285u, 38968u, 36781u, 34716u,
    32768u, 30929u, 29193u, 27554u, 26008u, 24548u, 23170u, 21870u, 20643u, 19484u, 18390u, 17358u, 16384u};
static uint32_t semi_ratio(int32_t k)           /* 2^(k/12), Q16, k = -36..+36 */
{
    k = clampi(k, -36, 36);
    if (k >= 0)
        return k > 24 ? SEMI_Q16[k - 12] << 1 : SEMI_Q16[k];
    k = -k;
    return k > 24 ? SEMI_INV_Q16[k - 12] >> 1 : SEMI_INV_Q16[k];
}

static uint32_t pitch_inc(int32_t p)            /* p: semitones Q8 (MIDI note * 256) -> phase step per frame */
{
    uint32_t semi, base;
    p = clampi(p, 0, 131 * 256 + 255);
    semi = (uint32_t)p >> 8;
    base = INC_C9[semi % 12u] >> (10u - semi / 12u);
    return (uint32_t)(((uint64_t)base * FINE[((uint32_t)p & 255u) >> 2]) >> 30);
}

static int32_t sine(uint32_t ph)                /* a full cycle over 2^32 -> -32767..32767 (refined parabola, ~0.1 %) */
{
    int32_t x = (int32_t)ph >> 16, ax = x < 0 ? -x : x, y, ay;
    y = (x * (32768 - ax)) >> 13;
    ay = y < 0 ? -y : y;
    y += ((((y * ay) >> 15) - y) * 7373) >> 15;
    return y > 32767 ? 32767 : y < -32767 ? -32767 : y;
}

static int32_t blep(uint32_t t, uint32_t dt)    /* polyBLEP for a rising edge of height 2, Q15; t: phase since it */
{
    uint32_t tq = t >> 16, dq = dt >> 16;
    int32_t x;
    if (!dq)
        return 0;
    if (tq < dq) {
        x = (int32_t)((tq << 15) / dq);
        return 2 * x - ((x * x) >> 15) - 32768;
    }
    if (tq > 65535u - dq) {
        x = -(int32_t)(((65536u - tq) << 15) / dq);
        return ((x * x) >> 15) + 2 * x + 32768;
    }
    return 0;
}

static int32_t sat(int32_t x)                   /* a soft knee from 16384, flat at 32767 */
{
    int32_t a = x < 0 ? -x : x;
    if (a > 16384) {
        a = 16384 + ((a - 16384) >> 1);
        if (a > 32767)
            a = 32767;
        x = x < 0 ? -a : a;
    }
    return x;
}

static int32_t crush_mask(int32_t c) { return c > 0 ? ~((1 << (2 * c)) - 1) : -1; }

/* the effects of the live layer that the voices need (kawa_fx.c sets them once per block) */
static int32_t lv_transpose;                    /* semitones: OCTAVE +1 / -1 */
static uint8_t lv_uni;                          /* 1 unison, 2 unison an octave down */
static uint8_t lv_mute;                         /* tracks silenced (SANS MELO / SANS BEAT), bit per track */

/* ---- CARRE, ONDE, BRUIT */
typedef struct {
    uint8_t gate, stage, note, vol, shape, crush, vib, arp_n, arp_i;
    int8_t arp_off[4];
    int32_t env;                                /* Q16 */
    int32_t pitch, ptgt, glide;                 /* Q8 semitones; glide: step per chunk toward ptgt */
    int32_t sweep, bend;                        /* Q8: the BALAYE offset (decays), a bend per chunk */
    uint32_t ph, ph2, vph, pwm, nph, lfsr;
    uint32_t arp_cnt, arp_len;                  /* frames */
    int32_t lp, amp, dc;                        /* dc: what the output's capacitor takes away (x 256) */
} tone_t;
static tone_t tone[4];

static void tone_on(uint32_t t, uint32_t note, uint32_t vol, uint32_t fx, int32_t fxv, uint32_t arp_len)
{
    tone_t *v = &tone[t];
    const int8_t *p = prj.snd[t].p;
    int32_t pt = (int32_t)note << 8;
    v->shape = (uint8_t)p[P_SHAPE];
    v->crush = (uint8_t)p[P_CRUSH];
    v->vib = (uint8_t)p[P_VIB];
    v->arp_n = 0;
    v->bend = 0;
    if (fx == FX_GLIDE && v->stage) {           /* glide from the note sounding */
        v->ptgt = pt;
        v->glide = 1 + fxv * fxv / 6;           /* 1: an octave a second .. 15: ~400 semitones a second */
    } else {
        v->pitch = v->ptgt = pt;
        v->glide = 0;
        v->sweep = p[P_SWEEP] * 512;
        if (v->env < 6000 && TRK_ENGINE[t] != E_NOISE)
            v->ph = v->ph2 = 0;                 /* the same start every time (chip punch), when it cannot click */
    }
    if (fx == FX_ARP && fxv >= 0 && fxv < 14) {
        uint32_t i;
        v->arp_n = (uint8_t)CHORDS[fxv].n;
        for (i = 0; i < 4u; i++)
            v->arp_off[i] = CHORDS[fxv].off[i];
        v->arp_i = 0;
        v->arp_cnt = 0;
        v->arp_len = arp_len ? arp_len : 700u;
    }
    if (fx == FX_VIB)
        v->vib = (uint8_t)fxv;
    if (fx == FX_BEND)
        v->bend = fxv;                          /* Q8 a chunk: 1 ~ 11 semitones a second */
    if (fx == FX_SHAPE)
        v->shape = (uint8_t)fxv;
    if (fx == FX_CRUSH)
        v->crush = (uint8_t)fxv;
    if (fx == FX_PITCH)
        v->pitch = v->ptgt = pt + fxv * 256;
    v->note = (uint8_t)note;
    v->vol = (uint8_t)vol;
    v->gate = 1;
    if (!v->lfsr)
        v->lfsr = 1;
    if (!(fx == FX_GLIDE && v->stage) || v->stage == 4)
        v->stage = 1;
}

static void tone_off(uint32_t t)
{
    tone[t].gate = 0;
    if (tone[t].stage && tone[t].stage < 4)
        tone[t].stage = 4;
}

static void tone_chunk(uint32_t t, int32_t *out)      /* CHUNK frames into out (mono, added) */
{
    tone_t *v = &tone[t];
    const int8_t *p = prj.snd[t].p;
    uint32_t i, inc, inc2 = 0, eng = TRK_ENGINE[t], duty = 0x80000000u, ph, ph2;
    int32_t pit, gain, tgt, da, amp, a = TON_A[clampi(p[P_TON], 0, 15)], m = crush_mask(v->crush), lp;
    if (!v->stage && !v->amp)
        return;
    switch (v->stage) {                         /* ADSR, once a chunk */
    case 1:
        v->env += ENV_RATE[p[P_ATT] & 15];
        if (v->env >= 65535) {
            v->env = 65535;
            v->stage = 2;
        }
        break;
    case 2:
        tgt = p[P_SUS] * 4369;
        v->env -= ENV_RATE[p[P_DEC] & 15] >> 1;
        if (v->env <= tgt) {
            v->env = tgt;
            v->stage = tgt ? 3 : 0;
        }
        break;
    case 4:
        v->env -= ENV_RATE[p[P_REL] & 15] >> 1;
        if (v->env <= 0) {
            v->env = 0;
            v->stage = 0;
        }
        break;
    }
    if (v->glide) {                             /* pitch: glide, bend, sweep, vibrato, arpeggio, the live octave */
        if (v->pitch < v->ptgt) { v->pitch += v->glide; if (v->pitch > v->ptgt) v->pitch = v->ptgt; }
        else if (v->pitch > v->ptgt) { v->pitch -= v->glide; if (v->pitch < v->ptgt) v->pitch = v->ptgt; }
    }
    v->pitch += v->bend;
    v->sweep = (int32_t)(((int64_t)v->sweep * 64880) >> 16);   /* tau ~35 ms */
    pit = v->pitch + v->sweep + lv_transpose * 256;
    if (v->vib) {
        v->vph += 9350000u;                     /* ~6 Hz */
        pit += (sine(v->vph) * v->vib * 14) >> 15;
    }
    if (v->arp_n) {
        v->arp_cnt += CHUNK;
        if (v->arp_cnt >= v->arp_len) {
            v->arp_cnt -= v->arp_len;
            if (++v->arp_i >= v->arp_n)
                v->arp_i = 0;
        }
        pit += v->arp_off[v->arp_i] * 256;
    }
    if (eng == E_NOISE)
        pit += 48 * 256;                        /* the noise clock runs four octaves over the note */
    inc = pitch_inc(pit);
    if (lv_uni && eng != E_NOISE)
        inc2 = lv_uni == 2 ? inc >> 1 : inc + (inc >> 7);
    gain = (int32_t)(((uint32_t)v->env * (uint32_t)v->env) >> 17);
    tgt = (int32_t)(((int64_t)gain * (v->vol * (p[P_VOL] & 15) * 5)) >> 12);
    if (lv_mute >> t & 1u)
        tgt = 0;
    amp = v->amp;
    da = (tgt - amp) / (int32_t)CHUNK;
    if (eng == E_PULSE) {
        static const uint32_t DUTY[4] = {0x20000000u, 0x40000000u, 0x80000000u, 0xC0000000u};
        if (v->shape < 4)
            duty = DUTY[v->shape];
        else {
            v->pwm += 1400000u;                 /* ~1 Hz */
            duty = 0x80000000u + (uint32_t)(sine(v->pwm) * 40000);
        }
    }
    ph = v->ph;
    ph2 = v->ph2;
    lp = v->lp;
    for (i = 0; i < CHUNK; i++) {
        int32_t s;
        if (eng == E_PULSE) {
            s = (ph < duty ? 32767 : -32767) + blep(ph, inc) - blep(ph - duty, inc);
            ph += inc;
            if (inc2) {
                s += (ph2 < duty ? 32767 : -32767) + blep(ph2, inc2) - blep(ph2 - duty, inc2);
                s = (s * 23170) >> 15;
                ph2 += inc2;
            }
        } else if (eng == E_WAVE) {
            const uint8_t *w = WAVES[v->shape & 7u];
            s = (w[ph >> 27] * 2 - 15) * 2184;
            ph += inc;
            if (inc2) {
                s = ((s + (w[ph2 >> 27] * 2 - 15) * 2184) * 23170) >> 15;
                ph2 += inc2;
            }
        } else {
            uint32_t o = ph;
            ph += inc;
            if (ph < o) {                       /* one LFSR step per wrap of the noise clock */
                uint32_t l = v->lfsr, b = (l ^ (l >> (v->shape ? 6u : 1u))) & 1u;
                v->lfsr = (l >> 1) | (b << 14);
            }
            s = (v->lfsr & 1u) ? 26000 : -26000;
        }
        s &= m;
        lp += ((s - lp) * a) >> 15;
        v->dc += (lp * 256 - v->dc) >> 11;      /* a ~3 Hz high-pass, as the chips' output capacitors */
        out[i] += ((lp - (v->dc >> 8)) * (amp >> 1)) >> 14;
        amp += da;
    }
    v->ph = ph;
    v->ph2 = ph2;
    v->lp = lp;
    v->amp = tgt;
}

/* ---- KIT: 16 drums, two voices */
typedef struct {
    uint8_t wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags;
} drumdef_t;
enum { DR_CLAP = 1, DR_METAL = 2, DR_BELL = 4, DR_CHIPN = 8 };
enum { W_SINE, W_TRI, W_SQUARE };
static const drumdef_t DRUMS[NDRUM] = {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* CAISSE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CHARLEY F */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* CHARLEY O */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* TOM BAS */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* TOM HAUT */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBALE */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* CLOCHE */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* BOUM 808 */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* KICK CHIP */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CAISSE CHIP */
};
typedef struct {
    uint8_t on, drum, crush;
    uint32_t ph, ph2, rnd, mph[6], t;
    int32_t note, pe, pek, ae, aek, ne, nek, hp, hpk, lp, drive, amp;
} drum_t;
static drum_t drum[2];
static uint8_t drum_next;

static void drum_on(uint32_t d, uint32_t vol, uint32_t fx, int32_t fxv)
{
    drum_t *v = &drum[drum_next];
    const drumdef_t *k = &DRUMS[d & 15u];
    const int8_t *p = prj.snd[T_KIT].p;
    int32_t dec = p[P_DECAY] * 2;
    drum_next ^= 1u;
    if (drum[drum_next].on && drum[drum_next].drum == (d & 15u))
        drum[drum_next].aek = drum[drum_next].nek = 40000;   /* the same drum again: the old one chokes */
    v->drum = (uint8_t)(d & 15u);
    v->note = (k->note + p[P_TUNE] + (fx == FX_PITCH ? fxv : 0)) * 256;
    v->pe = k->drop * 256;
    v->pek = DECAY_K[clampi(k->ptau, 0, 63)];
    v->ae = k->tone ? 65535 : 0;
    v->aek = DECAY_K[clampi(k->atau + dec, 0, 63)];
    v->ne = k->noise ? 65535 : 0;
    v->nek = DECAY_K[clampi(k->ntau + dec, 0, 63)];
    v->hpk = TON_A[k->nhp];
    v->drive = 1 + k->drive + p[P_DRIVE];
    v->amp = (int32_t)vol * (p[P_VOL] & 15) * 7;
    v->crush = (uint8_t)(fx == FX_CRUSH ? fxv : p[P_KCRUSH]);
    v->ph = v->ph2 = 0;
    v->t = 0;
    if (!v->rnd)
        v->rnd = 0xACE1u + d;
    v->on = 1;
}

static void drum_chunk(drum_t *v, int32_t *out)
{
    const drumdef_t *k = &DRUMS[v->drum];
    uint32_t i, inc, inc2 = 0;
    int32_t ta = (int32_t)((uint32_t)(v->ae >> 1) * (uint32_t)(k->tone * 2185) >> 15);   /* Q15 */
    int32_t na = (int32_t)((uint32_t)(v->ne >> 1) * (uint32_t)(k->noise * 2185) >> 15);
    int32_t m = crush_mask(v->crush), amp = (lv_mute >> T_KIT & 1u) ? 0 : v->amp;
    static const uint32_t METAL_INC[6] = {39994000u, 72000000u, 59300000u, 101800000u, 105200000u, 155800000u};
    if (!v->on)
        return;
    inc = pitch_inc(v->note + v->pe);
    if (k->flags & DR_BELL)
        inc2 = (uint32_t)(((uint64_t)inc * 96000u) >> 16);
    for (i = 0; i < CHUNK; i++) {
        int32_t s = 0, n;
        if (ta) {
            int32_t o;
            if (k->wave == W_SINE)
                o = sine(v->ph);
            else if (k->wave == W_TRI)
                o = (int32_t)((v->ph >> 28) < 8u ? (v->ph >> 28) : 15u - (v->ph >> 28)) * 9362 - 32767;
            else
                o = (v->ph < 0x80000000u ? 20000 : -20000);
            if (inc2)
                o = (o + (v->ph2 < 0x80000000u ? 20000 : -20000)) >> 1;
            s += (o * ta) >> 15;
            v->ph += inc;
            v->ph2 += inc2;
        }
        if (na) {
            if (k->flags & DR_METAL) {          /* six detuned squares, as the 808 cymbal */
                uint32_t j;
                n = 0;
                for (j = 0; j < 6u; j++) {
                    v->mph[j] += METAL_INC[j];
                    n += v->mph[j] < 0x80000000u ? 5000 : -5000;
                }
            } else if (k->flags & DR_CHIPN) {
                uint32_t l = v->rnd & 0x7FFFu, b = (l ^ (l >> 1)) & 1u;
                if ((v->t & 3u) == 0u)
                    v->rnd = (l >> 1) | (b << 14) | 1u;
                n = (v->rnd & 1u) ? 24000 : -24000;
            } else
                n = (int32_t)(xr(&v->rnd) >> 16) - 32768;
            v->hp += ((n - v->hp) * v->hpk) >> 15;
            n -= v->hp;
            if (k->flags & DR_CLAP) {           /* three hands, then the room */
                uint32_t tt = v->t;
                if (tt < 1400u && (tt % 440u) > 300u)
                    n = 0;
            }
            s += (n * na) >> 15;
        }
        s = sat(s * v->drive) & m;
        v->lp += ((s - v->lp) * TON_A[clampi(prj.snd[T_KIT].p[P_TON], 0, 15)]) >> 15;
        out[i] += (v->lp * amp) >> 12;
        v->t++;
    }
    v->pe = (int32_t)(((int64_t)v->pe * v->pek) >> 16);
    v->ae = (int32_t)(((int64_t)v->ae * v->aek) >> 16);
    v->ne = (int32_t)(((int64_t)v->ne * v->nek) >> 16);
    if (v->ae < 40 && v->ne < 40)
        v->on = 0;
}

/* ---- CASSE: the break, 16 slices; two voices so that a new slice fades the last one out */
typedef struct {
    uint8_t on, rev, brk, crush;
    uint32_t pos, step, lo, hi;                 /* Q16, in the break's samples (22050 Hz) */
    int32_t g, gtgt, gstep, fade_at, rel;
    int32_t drive, lp, amp;
} brkv_t;
static brkv_t brkv[2];
static uint8_t brk_next;

static void brk_on(uint32_t slice, uint32_t vol, uint32_t fx, int32_t fxv)
{
    const int8_t *p = prj.snd[T_CASSE].p;
    brkv_t *v = &brkv[brk_next], *o = &brkv[brk_next ^ 1u];
    uint32_t q = DUR_Q[clampi(p[P_LEN], 0, 11)], s0, s1, ratio;
    int32_t semis = p[P_BTUNE] + lv_transpose + (fx == FX_PITCH ? fxv : 0);
    if (o->on)
        o->gtgt = 0, o->gstep = -(32767 / 96);  /* ~2 ms */
    brk_next ^= 1u;
    slice &= 15u;
    v->brk = (uint8_t)clampi(p[P_BRK], 0, BRK_N - 1);
    s0 = slice * BRK_LEN / 16u;
    s1 = q ? s0 + q * BRK_LEN / 64u : BRK_LEN - 2u;
    if (s1 > BRK_LEN - 2u)
        s1 = BRK_LEN - 2u;
    v->lo = s0 << 16;
    v->hi = s1 << 16;
    v->rev = fx == FX_REV;
    v->pos = v->rev ? v->hi : v->lo;
    ratio = semi_ratio(semis);
    v->step = (32768u * (ratio >> 4)) >> 12;    /* 22050 -> 44100: 0.5, times the pitch */
    if (p[P_FIT])                               /* CALE: the break follows the tempo */
        v->step = (uint32_t)(((uint64_t)v->step * (((uint32_t)prj.bpm << 16) / BRK_BPM)) >> 16);
    v->g = 0;
    v->gtgt = 32767;
    v->gstep = p[P_BATT] ? 32767 / (p[P_BATT] * 90) + 1 : 32767;
    v->rel = p[P_BREL];
    v->fade_at = 0;
    v->drive = 1 + p[P_BDRIVE];
    v->crush = (uint8_t)(fx == FX_CRUSH ? fxv : p[P_BCRUSH]);
    v->amp = (int32_t)vol * (p[P_VOL] & 15) * 7;
    v->on = 1;
}

static void brk_chunk(brkv_t *v, int32_t *out)
{
    const uint8_t *d = BRK_DATA[v->brk];
    uint32_t i;
    int32_t m = crush_mask(v->crush), a = TON_A[clampi(prj.snd[T_CASSE].p[P_TON], 0, 15)];
    int32_t amp = (lv_mute >> T_CASSE & 1u) ? 0 : v->amp;
    uint32_t remain;
    if (!v->on)
        return;
    remain = v->rev ? (v->pos - v->lo) : (v->hi - v->pos);
    if (!v->fade_at && remain < (uint32_t)(v->rel * 260 + 32) * v->step) {   /* the end: RELACHE fades */
        v->fade_at = 1;
        v->gtgt = 0;
        v->gstep = -(32767 / (v->rel * 260 + 32) + 1);
    }
    for (i = 0; i < CHUNK; i++) {
        uint32_t k = v->pos >> 16, f = (v->pos >> 2) & 0x3FFFu;
        int32_t x0 = BRK_ULAW[d[k]], x1 = BRK_ULAW[d[k + 1u]], s;
        s = x0 + (((x1 - x0) * (int32_t)f) >> 14);
        s = sat(s * v->drive) & m;
        v->g += v->gstep;
        if ((v->gstep > 0 && v->g > v->gtgt) || (v->gstep < 0 && v->g < v->gtgt))
            v->g = v->gtgt;
        s = (s * v->g) >> 15;
        v->lp += ((s - v->lp) * a) >> 15;
        out[i] += (v->lp * amp) >> 12;
        if (v->rev) {
            if (v->pos <= v->lo + v->step) { v->on = 0; break; }
            v->pos -= v->step;
        } else {
            v->pos += v->step;
            if (v->pos >= v->hi) { v->on = 0; break; }
        }
    }
    if (v->g <= 0 && v->gtgt == 0)
        v->on = 0;
}

/* ---- one interface for the sequencer */
static void voice_on(uint32_t t, uint32_t note, uint32_t vol, uint32_t fx, uint32_t fxv, uint32_t arp_len)
{
    int32_t sv = (int8_t)fxv;
    if (note == NOTE_OFF) {
        if (t < 4u)
            tone_off(t);
        else if (t == T_CASSE) {
            uint32_t i;
            for (i = 0; i < 2u; i++)
                brkv[i].gtgt = 0, brkv[i].gstep = -(32767 / 200);
        }
        return;
    }
    trig_ms[t] = fm1_ms;
    if (t < 4u)
        tone_on(t, note, vol, fx, sv, arp_len);
    else if (t == T_KIT)
        drum_on(cell_idx(note), vol, fx, sv);
    else
        brk_on(cell_idx(note), vol, fx, sv);
}

static void voice_off(uint32_t t)
{
    if (t < 4u)
        tone_off(t);
}

static void voices_silence(void)
{
    uint32_t t;
    for (t = 0; t < 4u; t++)
        tone_off(t);
}
