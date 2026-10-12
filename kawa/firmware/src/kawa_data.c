/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: names, parameter descriptions, factory sounds, chords, scales, the live effects and the magic
 * tools. Text on the screen is upper case without accents (the font is ASCII), in three languages:
 * French, English, Spanish (PROJETS / PROJECTS / PROYECTO, KNOB 3). Tables hold [3] names in that order. */

enum { LANG_FR, LANG_EN, LANG_ES, LANG_N };
static uint8_t lang = LANG_EN;                  /* the screen's language (kept in the settings sector) */
#define TR(fr, en, es) (lang == LANG_EN ? (en) : lang == LANG_ES ? (es) : (fr))
static int32_t clampi(int32_t v, int32_t lo, int32_t hi) { return v < lo ? lo : v > hi ? hi : v; }
static const char *const LANG_NAME[LANG_N] = {"FRANCAIS", "ENGLISH", "ESPANOL"};

/* ---- the six tracks */
#define NTRK 6u
enum { T_PU1, T_PU2, T_ONDE, T_BRUIT, T_KIT, T_CASSE };
enum { E_PULSE, E_WAVE, E_NOISE, E_KIT, E_BREAK, E_N };
static const uint8_t TRK_ENGINE[NTRK] = {E_PULSE, E_PULSE, E_WAVE, E_NOISE, E_KIT, E_BREAK};
static const char *const TRK_NAMES[LANG_N][NTRK] = {{"CARRE 1", "CARRE 2", "ONDE", "BRUIT", "KIT", "CASSE"},
                                                    {"PULSE 1", "PULSE 2", "WAVE", "NOISE", "KIT", "BREAK"},
                                                    {"PULSO 1", "PULSO 2", "ONDA", "RUIDO", "KIT", "BREAK"}};
#define TRK_NAME TRK_NAMES[lang]
static const uint8_t ENGINE_ICON[E_N] = {ICO_PULSE, ICO_WAVE, ICO_NOISE, ICO_KIT, ICO_BREAK};
#define IS_TONAL(t) (TRK_ENGINE[t] <= E_NOISE)

/* ---- colours (RGB565) */
#define C_BG RGB(18, 12, 36)
#define C_BG2 RGB(24, 17, 46)
#define C_BEAT RGB(36, 26, 68)
#define C_RULE RGB(52, 40, 92)
#define C_FAINT RGB(96, 84, 148)
#define C_MID RGB(160, 150, 210)
#define C_TXT RGB(232, 228, 255)
#define C_GOLD RGB(255, 222, 110)
#define C_REC RGB(255, 64, 96)
#define C_GO RGB(96, 255, 150)
static const uint16_t TRK_COL[NTRK] = {RGB(255, 95, 180), RGB(255, 176, 58), RGB(62, 216, 255),
                                       RGB(232, 240, 96), RGB(98, 242, 154), RGB(169, 139, 255)};

/* ---- sound parameters: 12 per track, 3 pages of 4 (the four knobs); page 3 is the same for all */
#define NPARAM 12u
enum { P_SHAPE, P_ATT, P_DEC, P_SUS, P_REL, P_SWEEP, P_VIB, P_CRUSH, P_VOL, P_PAN, P_ECHO, P_TON };
enum { P_TUNE = 0, P_DECAY = 1, P_DRIVE = 2, P_KCRUSH = 3 };                       /* KIT */
enum { P_BRK = 0, P_BTUNE = 1, P_LEN = 2, P_FIT = 3, P_BATT = 4, P_BREL = 5, P_BDRIVE = 6, P_BCRUSH = 7 };  /* CASSE */
enum { K_NUM, K_SIGN, K_LIST, K_NAMES, K_PAN };  /* K_LIST: n values x 3 languages; K_NAMES: names, not translated */
typedef struct {
    const char *name[LANG_N];
    int8_t lo, hi;
    uint8_t kind;
    const char *const *list;
} pdesc_t;
static const char *const L_DUTY[] = {"12%", "25%", "50%", "75%", "PWM", "12%", "25%", "50%", "75%", "PWM",
                                     "12%", "25%", "50%", "75%", "PWM"};
static const char *const L_WAVE[] = {"TRI", "SCIE", "SINUS", "DOUX", "GB", "ORGUE", "VOIX", "FM",
                                     "TRI", "SAW", "SINE", "SOFT", "GB", "ORGAN", "VOICE", "FM",
                                     "TRI", "SIERRA", "SENO", "SUAVE", "GB", "ORGANO", "VOZ", "FM"};
static const char *const L_NOISE[] = {"LONG", "METAL", "LONG", "METAL", "LARGO", "METAL"};
static const char *const L_DUR[] = {"1/4", "1/2", "3/4", "1", "1.5", "2", "3", "4", "6", "8", "12", "TOUT",
                                    "1/4", "1/2", "3/4", "1", "1.5", "2", "3", "4", "6", "8", "12", "ALL",
                                    "1/4", "1/2", "3/4", "1", "1.5", "2", "3", "4", "6", "8", "12", "TODO"};
static const uint8_t DUR_Q[12] = {1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 0};   /* quarter slices, 0 = to the end */
static const char *const L_ONOFF[] = {"NON", "OUI", "NO", "YES", "NO", "SI"};
#define PD_ENV {{"ATTAQUE", "ATTACK", "ATAQUE"}, 0, 15, K_NUM, 0}, {{"DECLIN", "DECAY", "CAIDA"}, 0, 15, K_NUM, 0}, \
               {{"TENUE", "SUSTAIN", "SOSTEN"}, 0, 15, K_NUM, 0}
#define PD_MOVE {{"RELACHE", "RELEASE", "SUELTA"}, 0, 15, K_NUM, 0}, {{"BALAYE", "SWEEP", "BARRIDO"}, -15, 15, K_SIGN, 0}, \
                {{"VIBRATO", "VIBRATO", "VIBRATO"}, 0, 15, K_NUM, 0}, {{"ECRASE", "CRUSH", "TRITURA"}, 0, 7, K_NUM, 0}
#define PD_MIX {{"VOLUME", "VOLUME", "VOLUMEN"}, 0, 15, K_NUM, 0}, {{"PANO", "PAN", "PANEO"}, -7, 7, K_PAN, 0}, \
               {{"ECHO", "ECHO", "ECO"}, 0, 15, K_NUM, 0}, {{"TON", "TONE", "TONO"}, 0, 15, K_NUM, 0}
#define PD_SHAPE {"FORME", "SHAPE", "FORMA"}
#define PD_NONE {{0, 0, 0}, 0, 0, 0, 0}
static const pdesc_t PDESC[E_N][NPARAM] = {
    {{PD_SHAPE, 0, 4, K_LIST, L_DUTY}, PD_ENV, PD_MOVE, PD_MIX},
    {{PD_SHAPE, 0, 7, K_LIST, L_WAVE}, PD_ENV, PD_MOVE, PD_MIX},
    {{PD_SHAPE, 0, 1, K_LIST, L_NOISE}, PD_ENV, PD_MOVE, PD_MIX},
    {{{"ACCORD", "TUNE", "AFINA"}, -12, 12, K_SIGN, 0}, {{"DECLIN", "DECAY", "CAIDA"}, -8, 8, K_SIGN, 0},
     {{"SATURE", "DRIVE", "SATURA"}, 0, 15, K_NUM, 0}, {{"ECRASE", "CRUSH", "TRITURA"}, 0, 7, K_NUM, 0},
     PD_NONE, PD_NONE, PD_NONE, PD_NONE, PD_MIX},
    {{{"BREAK", "BREAK", "BREAK"}, 0, BRK_N - 1, K_NAMES, BRK_NAME}, {{"ACCORD", "TUNE", "AFINA"}, -12, 12, K_SIGN, 0},
     {{"DUREE", "LENGTH", "LARGO"}, 0, 11, K_LIST, L_DUR}, {{"CALE", "FIT", "AJUSTE"}, 0, 1, K_LIST, L_ONOFF},
     {{"ATTAQUE", "ATTACK", "ATAQUE"}, 0, 15, K_NUM, 0}, {{"RELACHE", "RELEASE", "SUELTA"}, 0, 15, K_NUM, 0},
     {{"SATURE", "DRIVE", "SATURA"}, 0, 15, K_NUM, 0}, {{"ECRASE", "CRUSH", "TRITURA"}, 0, 7, K_NUM, 0}, PD_MIX},
};
static const char *pd_value(const pdesc_t *d, int32_t v)   /* a list's value in the language */
{
    v = clampi(v, d->lo, d->hi);
    if (d->kind == K_NAMES) return d->list[v];
    return d->list[(uint32_t)lang * (uint32_t)(d->hi - d->lo + 1) + (uint32_t)(v - d->lo)];
}

/* ---- factory sounds: a name and the 12 parameters */
typedef struct {
    const char *name[LANG_N];
    int8_t p[NPARAM];
} preset_t;
static const preset_t PRE_PULSE[] = {
    {{"LEAD 25", "LEAD 25", "LEAD 25"}, {1, 0, 6, 10, 5, 0, 3, 0, 12, 0, 3, 15}},
    {{"BIP 12", "BEEP 12", "BIP 12"}, {0, 0, 4, 0, 3, 0, 0, 0, 12, 0, 4, 15}},
    {{"CARRE 50", "SQUARE 50", "CUADRADA 50"}, {2, 0, 8, 12, 5, 0, 0, 0, 11, 0, 0, 13}},
    {{"PLUCK", "PLUCK", "PLUCK"}, {1, 0, 5, 0, 4, 0, 0, 0, 13, 0, 4, 12}},
    {{"LASER", "LASER", "LASER"}, {0, 0, 7, 0, 4, 12, 0, 0, 11, 0, 4, 15}},
    {{"PWM PAD", "PWM PAD", "PWM PAD"}, {4, 7, 9, 11, 9, 0, 2, 0, 10, 0, 6, 11}},
    {{"BASSE", "BASS", "BAJO"}, {2, 0, 7, 9, 3, 0, 0, 0, 13, 0, 0, 9}},
    {{"SALE", "DIRTY", "SUCIO"}, {1, 0, 6, 10, 4, 0, 0, 5, 12, 0, 2, 15}},
};
static const preset_t PRE_WAVE[] = {
    {{"BASSE NES", "NES BASS", "BAJO NES"}, {0, 0, 8, 13, 3, 0, 0, 0, 14, 0, 0, 15}},
    {{"BASSE GB", "GB BASS", "BAJO GB"}, {4, 0, 6, 10, 3, 0, 0, 0, 14, 0, 0, 12}},
    {{"SCIE", "SAW", "SIERRA"}, {1, 0, 7, 9, 5, 0, 2, 0, 11, 0, 3, 13}},
    {{"FLUTE", "FLUTE", "FLAUTA"}, {2, 4, 8, 12, 7, 0, 4, 0, 11, 0, 5, 12}},
    {{"ORGUE", "ORGAN", "ORGANO"}, {5, 1, 9, 13, 6, 0, 0, 0, 10, 0, 3, 13}},
    {{"VOIX", "VOICE", "VOZ"}, {6, 3, 8, 11, 7, 0, 5, 0, 10, 0, 6, 12}},
    {{"FM CLOCHE", "FM BELL", "CAMPANA FM"}, {7, 0, 10, 0, 9, 0, 0, 0, 11, 0, 6, 14}},
    {{"KICK TRI", "KICK TRI", "KICK TRI"}, {0, 0, 4, 0, 2, 15, 0, 0, 15, 0, 0, 15}},
};
static const preset_t PRE_NOISE[] = {
    {{"CHARLEY", "HI-HAT", "CHARLES"}, {0, 0, 2, 0, 2, 0, 0, 0, 10, 2, 0, 15}},
    {{"CAISSE", "SNARE", "CAJA"}, {0, 0, 5, 0, 4, -3, 0, 0, 12, 0, 2, 13}},
    {{"METAL", "METAL", "METAL"}, {1, 0, 4, 0, 3, 0, 0, 0, 10, 0, 3, 15}},
    {{"VAPEUR", "STEAM", "VAPOR"}, {0, 8, 10, 8, 9, 0, 0, 0, 9, 0, 6, 10}},
    {{"EXPLOSION", "EXPLOSION", "EXPLOSION"}, {0, 0, 12, 0, 10, -8, 0, 0, 13, 0, 4, 11}},
    {{"CRASH", "CRASH", "CRASH"}, {0, 0, 11, 0, 10, 0, 0, 0, 10, 0, 5, 15}},
};
static const preset_t PRE_KIT[] = {
    {{"CLASSIQUE", "CLASSIC", "CLASICO"}, {0, 0, 2, 0, 0, 0, 0, 0, 13, 0, 0, 15}},
    {{"GABBER", "GABBER", "GABBER"}, {0, 2, 12, 0, 0, 0, 0, 0, 13, 0, 0, 13}},
    {{"LOFI", "LOFI", "LOFI"}, {0, 0, 4, 4, 0, 0, 0, 0, 12, 0, 2, 10}},
    {{"MINUS", "MINUS", "MINUS"}, {-3, -3, 6, 0, 0, 0, 0, 0, 13, 0, 0, 12}},
};
static const preset_t PRE_BREAK[] = {
    {{"AMENE", "AMENE", "AMENE"}, {0, 0, 11, 1, 0, 2, 2, 0, 13, 0, 0, 15}},
    {{"PENSE", "PENSE", "PENSE"}, {1, 0, 11, 1, 0, 2, 2, 0, 13, 0, 0, 15}},
    {{"FUNKY", "FUNKY", "FUNKY"}, {2, 0, 11, 1, 0, 2, 2, 0, 13, 0, 0, 15}},
    {{"ECLAIR", "ECLAIR", "ECLAIR"}, {3, 0, 11, 1, 0, 2, 2, 0, 13, 0, 0, 15}},
    {{"AMENE SALE", "AMENE DIRTY", "AMENE SUCIO"}, {0, 0, 11, 1, 0, 2, 10, 3, 13, 0, 0, 12}},
    {{"AMENE COURT", "AMENE SHORT", "AMENE CORTO"}, {0, 0, 3, 1, 0, 1, 2, 0, 13, 0, 0, 15}},
};
#define NPRE(a) ((uint8_t)(sizeof(a) / sizeof((a)[0])))
static const preset_t *const PRESETS_OF[E_N] = {PRE_PULSE, PRE_WAVE, PRE_NOISE, PRE_KIT, PRE_BREAK};
static const uint8_t NPRESETS_OF[E_N] = {NPRE(PRE_PULSE), NPRE(PRE_WAVE), NPRE(PRE_NOISE), NPRE(PRE_KIT), NPRE(PRE_BREAK)};
static const uint8_t TRK_PRESET0[NTRK] = {0, 1, 0, 0, 1, 0};   /* each track's sound on a new project */

/* ---- the KIT's sixteen drums (the white keys) */
#define NDRUM 16u
static const char *const DRUM3S[2][NDRUM] = {     /* French; English and Spanish (the usual codes) */
    {"KIK", "GAB", "CAI", "CLP", "CHF", "CHO", "TMB", "TMH", "CYM", "RID", "CLO", "RIM", "ZAP", "808", "KCH", "CCH"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"}};
static const char *const DRUM2S[2][NDRUM] = {
    {"KI", "GA", "CA", "CP", "HH", "OH", "TB", "TH", "CY", "RI", "CO", "RM", "ZP", "80", "KC", "CC"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"}};
#define DRUM3 DRUM3S[lang != LANG_FR]
#define DRUM2 DRUM2S[lang != LANG_FR]

/* ---- notes */
static const char *const NOTE_NAME[12] = {"C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"};
#define NOTE_NONE 0u
#define NOTE_OFF 255u
#define KEY0 53u                                /* key 0 = F3 */
static int is_black(uint32_t note) { return (0x54Au >> (note % 12u)) & 1u; }
static int8_t WHITE_OF_KEY[27], BLACK_OF_KEY[27];    /* key -> its index among the white / black keys, or -1 */
static uint8_t KEY_OF_WHITE[16], KEY_OF_BLACK[11];
static void keys_init(void)
{
    uint32_t k, w = 0, b = 0;
    for (k = 0; k < 27u; k++) {
        WHITE_OF_KEY[k] = BLACK_OF_KEY[k] = -1;
        if (is_black(KEY0 + k)) { BLACK_OF_KEY[k] = (int8_t)b; KEY_OF_BLACK[b++] = (uint8_t)k; }
        else { WHITE_OF_KEY[k] = (int8_t)w; KEY_OF_WHITE[w++] = (uint8_t)k; }
    }
}

/* ---- the cell tricks (FX column): a type and a value */
enum { FX_NONE, FX_ARP, FX_GLIDE, FX_VIB, FX_ROLL, FX_BEND, FX_CHANCE, FX_DELAY, FX_CUT, FX_REV, FX_PITCH, FX_SHAPE,
       FX_CRUSH, FX_N };
typedef struct {
    const char *tag[LANG_N];                    /* three letters */
    uint8_t icon;
    int8_t lo, hi, def;
} fxdesc_t;
static const fxdesc_t FXD[FX_N] = {
    {{"---", "---", "---"}, ICO_ERASE, 0, 0, 0},
    {{"ARP", "ARP", "ARP"}, ICO_ARP, 0, 13, 1},             /* arpeggio */
    {{"GLI", "GLI", "GLI"}, ICO_GLIDE, 1, 15, 6},           /* glide */
    {{"VIB", "VIB", "VIB"}, ICO_VIB, 1, 15, 5},             /* vibrato */
    {{"ROL", "ROL", "RED"}, ICO_ROLL, 0, 8, 2},             /* roll (redoble) */
    {{"BND", "BND", "BND"}, ICO_BEND, -15, 15, -6},         /* bend */
    {{"CHN", "CHN", "AZR"}, ICO_DICE, 1, 9, 5},             /* chance (azar) */
    {{"RET", "DLY", "RET"}, ICO_CLOCK, 1, 23, 12},          /* delay (retard, retraso) */
    {{"CUT", "CUT", "CRT"}, ICO_CUT, 1, 23, 12},            /* cut (coupe, corte) */
    {{"ENV", "REV", "REV"}, ICO_REV, 0, 0, 0},              /* reverse (envers, reves) */
    {{"HAU", "PIT", "ALT"}, ICO_SHARP, -12, 12, 12},        /* pitch (hauteur, altura) */
    {{"FOR", "SHP", "FOR"}, ICO_SHAPE, 0, 7, 0},            /* shape (forme, forma) */
    {{"ECR", "CRU", "TRI"}, ICO_CRUSH, 1, 7, 4},            /* crush (ecrase, tritura) */
};
static const uint8_t ROLL_N[9] = {2, 3, 4, 6, 8, 12, 16, 24, 32};
typedef struct {
    const char *name[LANG_N];
    int8_t n, off[4];
} chord_t;
static const chord_t CHORDS[14] = {
    {{"MAJ", "MAJ", "MAY"}, 3, {0, 4, 7, 0}}, {{"MIN", "MIN", "MEN"}, 3, {0, 3, 7, 0}}, {{"OCT", "OCT", "OCT"}, 2, {0, 12, 0, 0}},
    {{"5TE", "5TH", "5TA"}, 2, {0, 7, 0, 0}}, {{"SUS", "SUS", "SUS"}, 3, {0, 5, 7, 0}}, {{"7", "7", "7"}, 4, {0, 4, 7, 10}},
    {{"MA7", "MA7", "MA7"}, 4, {0, 4, 7, 11}}, {{"MI7", "MI7", "ME7"}, 4, {0, 3, 7, 10}}, {{"DIM", "DIM", "DIS"}, 3, {0, 3, 6, 0}},
    {{"AUG", "AUG", "AUM"}, 3, {0, 4, 8, 0}}, {{"2OC", "2OC", "2OC"}, 3, {0, 12, 24, 0}}, {{"AD9", "AD9", "AD9"}, 4, {0, 4, 7, 14}},
    {{"TRI", "TRL", "TRI"}, 2, {0, 1, 0, 0}}, {{"BAS", "LOW", "BAJ"}, 2, {0, -12, 0, 0}},
};

/* ---- scales (bit n: semitone n above the root) */
typedef struct {
    const char *name[LANG_N];
    uint16_t mask;
} scale_t;
static const scale_t SCALES[12] = {
    {{"CHROMA", "CHROMATIC", "CROMATICA"}, 0xFFF}, {{"MAJEUR", "MAJOR", "MAYOR"}, 0xAB5},
    {{"MINEUR", "MINOR", "MENOR"}, 0x5AD}, {{"PENTA", "PENTA", "PENTA"}, 0x295},
    {{"PENTA MIN", "PENTA MIN", "PENTA MEN"}, 0x4A9}, {{"BLUES", "BLUES", "BLUES"}, 0x4E9},
    {{"DORIEN", "DORIAN", "DORICA"}, 0x6AD}, {{"PHRYGIEN", "PHRYGIAN", "FRIGIA"}, 0x5AB},
    {{"HARMONIQ", "HARMONIC", "ARMONICA"}, 0x9AD}, {{"JAPON", "JAPANESE", "JAPONESA"}, 0x1A3},
    {{"ARABE", "ARABIC", "ARABE"}, 0x9B3}, {{"PAR TONS", "WHOLE TONE", "TONOS"}, 0x555},
};

/* ---- live effects: hold FX (or tap it to keep the page open), then the white keys. Two banks of 16:
 * ids 0..31 (bit id of a mask); the LIVE lane of a pattern stores id + 1 (0: none) */
enum { LF_LOOP16, LF_LOOP12, LF_LOOP32, LF_LOOP64, LF_UNI, LF_UNILO, LF_OCTUP, LF_OCTDN,
       LF_STUT4, LF_STUT3, LF_SCR, LF_SCRF, LF_TRIP, LF_AGAIN, LF_REV, LF_ROLLUP,
       LF_CRUSH, LF_DECIM, LF_LPF, LF_HPF, LF_TAPE, LF_DIVE, LF_GATE16, LF_GATE32,
       LF_FREEZE, LF_RING, LF_ECHO, LF_DIST, LF_WOB, LF_VINYL, LF_NOMEL, LF_NOBEAT, LF_N };
typedef struct {
    const char *name[LANG_N], *sub[LANG_N];
    uint8_t icon;
} lfx_t;
static const lfx_t LFX[LF_N] = {
    {{"BOUCLE", "LOOP", "BUCLE"}, {"1/16", "1/16", "1/16"}, ICO_LOOP},
    {{"BOUCLE", "LOOP", "BUCLE"}, {"1/12", "1/12", "1/12"}, ICO_LOOP},
    {{"BOUCLE", "LOOP", "BUCLE"}, {"1/32", "1/32", "1/32"}, ICO_LOOP},
    {{"BOUCLE", "LOOP", "BUCLE"}, {"1/64", "1/64", "1/64"}, ICO_LOOP},
    {{"UNISSON", "UNISON", "UNISONO"}, {"", "", ""}, ICO_UNI},
    {{"UNISSON", "UNISON", "UNISONO"}, {"BAS", "LOW", "GRAVE"}, ICO_UNI},
    {{"OCTAVE", "OCTAVE", "OCTAVA"}, {"+1", "+1", "+1"}, ICO_UP},
    {{"OCTAVE", "OCTAVE", "OCTAVA"}, {"-1", "-1", "-1"}, ICO_DOWN},
    {{"BEGAIE", "STUTTER", "TARTAMU"}, {"X4", "X4", "X4"}, ICO_STUT},
    {{"BEGAIE", "STUTTER", "TARTAMU"}, {"X3", "X3", "X3"}, ICO_STUT},
    {{"SCRATCH", "SCRATCH", "SCRATCH"}, {"", "", ""}, ICO_DISC},
    {{"SCRATCH", "SCRATCH", "SCRATCH"}, {"VITE", "FAST", "RAPIDO"}, ICO_DISC},
    {{"6/8", "6/8", "6/8"}, {"TRIOLET", "TRIPLET", "SWING"}, ICO_TRI3},
    {{"RELANCE", "RETRIG", "REPITE"}, {"1 TEMPS", "1 BEAT", "1 PULSO"}, ICO_AGAIN},
    {{"ENVERS", "REVERSE", "REVES"}, {"", "", ""}, ICO_REV},
    {{"ROULEAU", "BUILDUP", "REDOBLE"}, {"ACCEL", "ROLL", "ACELERA"}, ICO_ACCEL},
    {{"ECRASE", "CRUSH", "TRITURA"}, {"4 BITS", "4 BITS", "4 BITS"}, ICO_CRUSH},
    {{"DECIME", "LO-FI", "DIEZMA"}, {"", "RATE", ""}, ICO_PIXEL},
    {{"FILTRE", "LOWPASS", "FILTRO"}, {"BAS", "SWEEP", "GRAVES"}, ICO_LPF},
    {{"FILTRE", "HIPASS", "FILTRO"}, {"HAUT", "SWEEP", "AGUDOS"}, ICO_HPF},
    {{"STOP", "TAPE", "CINTA"}, {"K7", "STOP", "PARADA"}, ICO_TAPE},
    {{"PLONGEE", "DIVE", "PICADO"}, {"", "", ""}, ICO_DIVE},
    {{"HACHE", "GATE", "GATE"}, {"1/16", "1/16", "1/16"}, ICO_GATE},
    {{"HACHE", "GATE", "GATE"}, {"1/32", "1/32", "1/32"}, ICO_GATE},
    {{"GEL", "FREEZE", "CONGELA"}, {"", "", ""}, ICO_SNOW},
    {{"ANNEAU", "RING", "ANILLO"}, {"", "", ""}, ICO_RING},
    {{"ECHO", "ECHO", "ECO"}, {"", "", ""}, ICO_ECHO},
    {{"DISTO", "DISTORT", "DISTOR"}, {"", "", ""}, ICO_DIST},
    {{"WOBBLE", "WOBBLE", "WOBBLE"}, {"", "", ""}, ICO_WOB},
    {{"VINYLE", "VINYL", "VINILO"}, {"", "", ""}, ICO_DISC},
    {{"SANS", "NO", "SIN"}, {"MELO", "MELODY", "MELODIA"}, ICO_NOMEL},
    {{"SANS", "NO", "SIN"}, {"BEAT", "BEAT", "RITMO"}, ICO_NOBEAT},
};
static const char *const LBANK_NAMES[LANG_N][2] = {{"POCHE", "CASSE"}, {"POCKET", "WRECK"}, {"BOLSA", "ROTO"}};
#define LBANK_NAME LBANK_NAMES[lang]
static const uint16_t LBANK_COL[2] = {RGB(255, 120, 200), RGB(255, 110, 70)};

/* ---- the magic tools: tap LFO (MAGIE), then a white key; one undo each (SAVE held) */
enum { MG_CHOP, MG_BEAT, MG_MELO, MG_BASS, MG_ARP, MG_EUCL, MG_VARY, MG_ROLLS, MG_NUANCE, MG_DOUBLE, MG_SHIFT,
       MG_REVERSE, MG_TRANSP, MG_COPY, MG_PASTE, MG_CLEAR, MG_N };
static const lfx_t MAGIC[MG_N] = {
    {{"HACHOIR", "CHOPPER", "PICADOR"}, {"BREAK", "BREAK", "BREAK"}, ICO_KNIFE},
    {{"BEAT", "BEAT", "RITMO"}, {"HASARD", "RANDOM", "AZAR"}, ICO_KIT},
    {{"MELODIE", "MELODY", "MELODIA"}, {"GAMME", "SCALE", "ESCALA"}, ICO_NOTE},
    {{"BASSE", "BASS", "BAJO"}, {"GAMME", "SCALE", "ESCALA"}, ICO_BASS},
    {{"ARPEGE", "ARP", "ARPEGIO"}, {"ACCORDS", "CHORDS", "ACORDES"}, ICO_ARP},
    {{"EUCLIDE", "EUCLID", "EUCLIDE"}, {"N COUPS", "N HITS", "GOLPES"}, ICO_EUCL},
    {{"VARIER", "VARY", "VARIAR"}, {"UN PEU", "A BIT", "UN POCO"}, ICO_DICE},
    {{"ROULES", "ROLLS", "REDOBLE"}, {"FINS", "ENDS", "FINAL"}, ICO_ROLL},
    {{"NUANCES", "ACCENTS", "MATICES"}, {"VOLUMES", "VOLUMES", "VOLUMEN"}, ICO_VOL},
    {{"DOUBLER", "DOUBLE", "DUPLICA"}, {"X2", "X2", "X2"}, ICO_X2},
    {{"DECALER", "SHIFT", "MOVER"}, {"1 PAS", "1 STEP", "1 PASO"}, ICO_RIGHT},
    {{"MIROIR", "MIRROR", "ESPEJO"}, {"SENS", "", ""}, ICO_MIRROR},
    {{"TRANSPO", "TRANSP", "TRANSP"}, {"+1 NOTE", "+1 NOTE", "+1 NOTA"}, ICO_UPDN},
    {{"COPIER", "COPY", "COPIAR"}, {"", "", ""}, ICO_COPY},
    {{"COLLER", "PASTE", "PEGAR"}, {"", "", ""}, ICO_PASTE},
    {{"EFFACER", "CLEAR", "BORRAR"}, {"", "", ""}, ICO_ERASE},
};
static const char *const L_SCOPES[LANG_N][2] = {{"PISTE", "MOTIF"}, {"TRACK", "PATTERN"}, {"PISTA", "PATRON"}};
#define L_SCOPE L_SCOPES[lang]

/* ---- names for new projects */
static const char *const NAME_A[8] = {"KAWA", "MIETTE", "PIXEL", "BOUM", "ZINZIN", "CHIP", "RAGE", "CANDY"};
static const char *const NAME_B[8] = {"ROSE", "VOLT", "NOIRE", "FOLLE", "MAGIK", "TURBO", "DOUCE", "SALE"};
