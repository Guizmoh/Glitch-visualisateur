/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the KIT engine: 16 synthesised drums a kit (kawa_kits.h), two voices a track. Included by
 * kawa_snd.c (the audio interrupt: integers only, no division per frame). The track's knobs: KIT, TUNE,
 * DECAY, DRIVE, CRUSH, TONE (P_KIT..P_KTON) */
typedef struct {
    uint8_t on, drum, crush, kit;
    uint32_t ph, ph2, rnd, mph[6], t;
    int32_t note, pe, pek, ae, aek, ne, nek, hp, hpk, drive;
} drum_t;
static drum_t drum[NTRK][2];
static uint8_t drum_next[NTRK];

static void drum_on(uint32_t t, uint32_t d, uint32_t fx, int32_t fxv)
{
    drum_t *v = &drum[t][drum_next[t]];
    const int8_t *p = prj.snd[t].p;
    const drumdef_t *k = &KITS[clampi(p[P_KIT], 0, NKIT - 1)][d & 15u];
    int32_t dec = p[P_DECAY] * 2;
    drum_next[t] ^= 1u;
    if (drum[t][drum_next[t]].on && drum[t][drum_next[t]].drum == (d & 15u))
        drum[t][drum_next[t]].aek = drum[t][drum_next[t]].nek = 40000;   /* the same drum again: the old one chokes */
    v->drum = (uint8_t)(d & 15u);
    v->kit = (uint8_t)clampi(p[P_KIT], 0, NKIT - 1);
    v->note = (k->note + p[P_TUNE] + (fx == FX_PITCH ? fxv : 0)) * 256;
    v->pe = k->drop * 256;
    v->pek = DECAY_K[clampi(k->ptau, 0, 63)];
    v->ae = k->tone ? 65535 : 0;
    v->aek = DECAY_K[clampi(k->atau + dec, 0, 63)];
    v->ne = k->noise ? 65535 : 0;
    v->nek = DECAY_K[clampi(k->ntau + dec, 0, 63)];
    v->hpk = TON_A[k->nhp];
    v->drive = 1 + k->drive + p[P_DRIVE];
    v->crush = (uint8_t)(fx == FX_CRUSH ? fxv : p[P_KCRUSH]);
    v->ph = v->ph2 = 0;
    v->t = 0;
    if (!v->rnd)
        v->rnd = 0xACE1u + d + t * 77u;
    v->on = 1;
}

static void drum_chunk(drum_t *v, int32_t *out)
{
    const drumdef_t *k = &KITS[v->kit][v->drum];
    uint32_t i, inc, inc2 = 0;
    int32_t ta = (int32_t)((uint32_t)(v->ae >> 1) * (uint32_t)(k->tone * 2185) >> 15);   /* Q15 */
    int32_t na = (int32_t)((uint32_t)(v->ne >> 1) * (uint32_t)(k->noise * 2185) >> 15);
    int32_t m = crush_mask(v->crush);
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
        out[i] += sat(s * v->drive) & m;
        v->t++;
    }
    v->pe = (int32_t)(((int64_t)v->pe * v->pek) >> 16);
    v->ae = (int32_t)(((int64_t)v->ae * v->aek) >> 16);
    v->ne = (int32_t)(((int64_t)v->ne * v->nek) >> 16);
    if (v->ae < 40 && v->ne < 40)
        v->on = 0;
}

static void drum_choke(drum_t *v)               /* CUT: the drum stops now (a short fade) */
{
    v->aek = v->nek = 50000;
}
