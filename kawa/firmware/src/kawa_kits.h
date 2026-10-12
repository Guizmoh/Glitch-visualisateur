/* SPDX-License-Identifier: GPL-3.0-only */
/* KAWA: the drum kits (the KIT engine, kawa_drums.c): 8 kits of 16 drums on the 16 white keys, their names
 * and the codes the tracker shows. Included before kawa_data.c (its KIT sound lists the kits) */
#define NDRUM 16u
#define NKIT 8u
static const char *const L_KITS[NKIT * 3u] = {   /* (K_LIST: French, English, Spanish) */
    "ACOUST.", "HIP HOP", "TECHNO", "DUB", "LO-FI", "GAMEBOY", "SNES", "PERCUS",
    "ACOUST.", "HIP HOP", "TECHNO", "DUB", "LO-FI", "GAMEBOY", "SNES", "PERCS",
    "ACUST.", "HIP HOP", "TECHNO", "DUB", "LO-FI", "GAMEBOY", "SNES", "PERCUS"};
static const char KIT_CODE3[NKIT][NDRUM][4] = {   /* what the tracker shows, wide (3) and narrow (2) */
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"},
    {"KIK", "GAB", "SNR", "CLP", "CHH", "OHH", "LTM", "HTM", "CYM", "RID", "BEL", "RIM", "ZAP", "808", "CKK", "CSN"}};
static const char KIT_CODE2[NKIT][NDRUM][3] = {
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"},
    {"KI", "GA", "SN", "CP", "HH", "OH", "LT", "HT", "CY", "RI", "BL", "RM", "ZP", "80", "CK", "CS"}};
typedef struct {
    uint8_t wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags;
} drumdef_t;
enum { DR_CLAP = 1, DR_METAL = 2, DR_BELL = 4, DR_CHIPN = 8 };
enum { W_SINE, W_TRI, W_SQUARE };
static const drumdef_t KITS[NKIT][NDRUM] = {{
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
},
    {
    /* wave, note, drop, ptau, atau, tone, noise, ntau, nhp, drive, flags   (taus: DECAY_K index, 7.6 ln(ms)) */
    {W_SINE, 31, 26, 26, 40, 15, 3, 8, 12, 2, 0},           /* KICK */
    {W_SINE, 33, 30, 24, 45, 15, 2, 8, 12, 12, 0},          /* GABBER */
    {W_SINE, 54, 7, 20, 30, 9, 13, 37, 9, 3, 0},            /* SNARE */
    {W_SINE, 60, 0, 10, 10, 0, 15, 35, 8, 2, DR_CLAP},      /* CLAP */
    {W_SINE, 60, 0, 10, 10, 0, 12, 21, 14, 0, 0},           /* CLOSED HAT */
    {W_SINE, 60, 0, 10, 10, 0, 12, 41, 14, 0, 0},           /* OPEN HAT */
    {W_SINE, 43, 5, 30, 39, 15, 2, 12, 10, 1, 0},           /* LOW TOM */
    {W_SINE, 50, 5, 30, 37, 15, 2, 12, 10, 1, 0},           /* HIGH TOM */
    {W_SINE, 60, 0, 10, 10, 0, 9, 52, 13, 0, DR_METAL},     /* CYMBAL */
    {W_SINE, 60, 0, 10, 10, 0, 5, 48, 13, 0, DR_METAL},     /* RIDE */
    {W_SQUARE, 76, 0, 10, 32, 11, 0, 10, 10, 0, DR_BELL},   /* COWBELL */
    {W_SINE, 88, 0, 10, 17, 13, 5, 8, 11, 2, 0},            /* RIM */
    {W_SQUARE, 36, 48, 22, 32, 12, 0, 10, 10, 1, 0},        /* ZAP */
    {W_SINE, 31, 5, 30, 52, 15, 0, 10, 10, 1, 0},           /* 808 BOOM */
    {W_TRI, 36, 36, 22, 33, 15, 0, 10, 10, 0, 0},           /* CHIP KICK */
    {W_TRI, 60, 12, 15, 20, 9, 13, 30, 8, 0, DR_CHIPN},     /* CHIP SNARE */
}};
