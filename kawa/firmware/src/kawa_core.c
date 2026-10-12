/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the project (patterns, sounds, song) and what the audio interrupt and the main loop share.
 *
 * A pattern is NROW rows of NTRK cells (note, volume, trick, its value) plus the LIVE lane: the live
 * effect recorded on each row. A project is 32 patterns, the sound of each track, the song (a list
 * of patterns), the tempo, the swing and the scale. It is all in RAM; kawa_edit.c keeps it in flash. */
#define NROW 32u
#define NPAT 32u
#define NSONG 64u
#define CHUNK 16u                               /* control rate: envelopes, pitch, sequencer every 16 frames */

typedef struct {
    uint8_t note, vol, fx, fxv;                 /* note: 0 empty, 255 OFF, else MIDI note / drum + 1 / slice + 1 */
} cell_t;
typedef struct {
    cell_t c[NROW][NTRK];
    uint8_t live[NROW];                         /* a live effect per row (LF_...), 0 = none */
    uint8_t len, pad[3];                        /* rows played, 1..32 */
} pat_t;
typedef struct {
    int8_t p[NPARAM];
    uint8_t preset, pad[3];
} sound_t;
#define PRJ_MAGIC 0x4157414Bu                   /* "KAWA" */
#define PRJ_VERSION 1u
typedef struct {
    uint32_t magic, version;
    char name[16];
    uint16_t bpm;
    uint8_t swing, root, scale, lock, mode, song_len;   /* swing 50..75 %; mode 0 loop, 1 song */
    uint8_t song[NSONG];
    sound_t snd[NTRK];
    uint8_t mute, step, pad[2];
    pat_t pat[NPAT];
    uint32_t crc;
} project_t;

#if defined(DINGHY_HOST) || defined(KAWA_WASM)
#define POOL
#else
#define POOL __attribute__((section(".pool")))
#endif
static project_t prj POOL;

/* the drum or the slice of a cell on the KIT / CASSE tracks */
static uint32_t cell_idx(uint32_t note) { return note - 1u; }

/* ---- shared with the audio interrupt (one writer each) */
static volatile uint8_t sq_play;                /* the sequencer runs (ISR) */
static volatile uint8_t sq_req;                 /* main -> ISR: 1 start, 2 stop */
static volatile uint8_t sq_pat, sq_row;         /* ISR: what plays now */
static volatile uint8_t sq_next = 0xFF;         /* main: the pattern to go to at the end of this one (loop mode) */
static volatile uint8_t sq_songpos;             /* ISR: the song position playing */
static volatile uint8_t sq_start_pat, sq_start_pos;   /* main: where a start begins */
static volatile uint32_t sq_rowtick;            /* ISR: counts rows played (the screen follows it) */
static volatile uint32_t sq_frac;               /* ISR: the phase in the row, 0..2^32 */
static volatile uint32_t trig_ms[NTRK];         /* ISR: when each track last played a note (the cells flash) */
static volatile uint16_t level[NTRK];           /* ISR: peak per track, the last block (MIX meters) */
static volatile uint32_t lfx_keys;              /* main: live effects held (bit LF_... ) */
static volatile uint32_t lfx_on;                /* ISR: live effects sounding now */
static volatile uint8_t live_mute;              /* main: tracks muted from the FX page (bit per track) */
static volatile uint8_t rec_live;               /* main: write live effects into the LIVE lane while playing */
static volatile uint32_t audio_us;              /* ISR: the last render's time */
static int16_t scope[240];                      /* ISR: the master, decimated, for the screens */
static uint32_t g_rowlen = 3845u;               /* ISR: frames per row (16th) at the tempo, without swing */
static uint32_t g_beatpos;                      /* ISR: frames since the last beat (the live effects lock to it) */
static volatile uint32_t scope_w;

/* main -> ISR: notes played on the keys (or a cell to hear), a small queue */
typedef struct {
    uint8_t type, trk, note, vol, fx, fxv;
} ev_t;
enum { EV_ON = 1, EV_OFF, EV_ALLOFF };
#define EVQ 32u
static ev_t evq[EVQ];
static volatile uint32_t evq_w, evq_r;
static void ev_push(uint32_t type, uint32_t trk, uint32_t note, uint32_t vol, uint32_t fx, uint32_t fxv)
{
    ev_t *e;
    if (evq_w - evq_r >= EVQ)
        return;
    e = &evq[evq_w % EVQ];
    e->type = (uint8_t)type;
    e->trk = (uint8_t)trk;
    e->note = (uint8_t)note;
    e->vol = (uint8_t)vol;
    e->fx = (uint8_t)fx;
    e->fxv = (uint8_t)fxv;
    RING_PUBLISH();
    evq_w++;
}

/* random numbers: one generator for the ISR, one for the main loop */
static uint32_t rnd_isr = 0x9E3779B9u, rnd_main = 0x1234567u;
static uint32_t xr(uint32_t *s)
{
    uint32_t x = *s;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return *s = x;
}
static uint32_t rnd(uint32_t n) { return n ? (xr(&rnd_main) >> 8) % n : 0u; }

