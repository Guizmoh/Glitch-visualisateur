/* =========================================================================
   sprites.js — TOUS LES DESSINS DU JEU, en texte !
   Chaque lettre = une couleur de la PALETTE ci-dessous. Le point "." = vide.
   Change une lettre, et le dessin change dans le jeu. Change une couleur
   de la palette, et tout ce qui l'utilise change d'un coup.
   ========================================================================= */

export const PALETTE = {
  '0': '#16131f', // contour (presque noir)
  '1': '#f7c9a3', // peau claire
  '2': '#d99a72', // peau ombre
  '3': '#57c96a', // tunique claire
  '4': '#2f8f4a', // tunique ombre
  '5': '#f3d264', // cheveux / or clair
  '6': '#f4f1de', // blanc creme
  '7': '#4a90d9', // bleu
  '8': '#e04a4a', // rouge
  '9': '#a8aec0', // gris clair
  a: '#585e70', // gris fonce
  b: '#8b5a3c', // marron
  c: '#1d6b3a', // vert fonce
  d: '#8a5ad9', // violet
  e: '#f2c14b', // jaune / or
  f: '#ef7d9d', // rose
  g: '#7ee0e8', // cyan
  h: '#c08552', // marron clair
  i: '#2a2440', // bleu nuit
  j: '#ff9d3a', // orange
  k: '#9a6b43', // haut marron de Night
  l: '#6e4527', // haut marron, dans l'ombre
  m: '#dcc89c', // pantalon beige
  n: '#b49b6b', // pantalon beige, dans l'ombre
  o: '#3f9e52', // le vert des yeux de Night
  q: '#5a3a22', // cheveux bruns
};

/* --------------------------------------------------------------------- */
/* LE HEROS  (16 x 16)                                                    */
/* --------------------------------------------------------------------- */

/* --------------------------------------------------------------------- */
/* NIGHT, le heros — 12 ans, yeux verts, haut marron, pantalon beige.     */
/* Voir SCENARIO.md. Pour changer sa tenue : les lettres k/l (haut),      */
/* m/n (pantalon), q (cheveux), o (yeux) renvoient a la PALETTE ci-dessus.*/
/* --------------------------------------------------------------------- */

export const NIGHT_BAS_0 = [
  '................',
  '.....000000.....',
  '....0qqqqqq0....',
  '...0qqqqqqqq0...',
  '...0q111111q0...',
  '...01o1111o10...',
  '...0111111110...',
  '....01111110....',
  '...0kkkkkkkk0...',
  '..01kkkkkkkk10..',
  '..01kkllkkkk10..',
  '...0llllllll0...',
  '...0mmmmmmmm0...',
  '...0mmm00mmm0...',
  '....0bb00bb0....',
  '.....000000.....',
];

export const NIGHT_BAS_1 = [
  '................',
  '.....000000.....',
  '....0qqqqqq0....',
  '...0qqqqqqqq0...',
  '...0q111111q0...',
  '...01o1111o10...',
  '...0111111110...',
  '....01111110....',
  '...0kkkkkkkk0...',
  '..01kkkkkkkk10..',
  '..01kkllkkkk10..',
  '...0llllllll0...',
  '...0mmmmmmmm0...',
  '...0mmm00mmm0...',
  '...0bb00bb0.....',
  '....000000......',
];

export const NIGHT_HAUT_0 = [
  '................',
  '.....000000.....',
  '....0qqqqqq0....',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '....0qqqqqq0....',
  '...0kkkkkkkk0...',
  '..01kkkkkkkk10..',
  '..01kkkkkkkk10..',
  '...0llllllll0...',
  '...0mmmmmmmm0...',
  '...0mmm00mmm0...',
  '....0bb00bb0....',
  '.....000000.....',
];

export const NIGHT_HAUT_1 = [
  '................',
  '.....000000.....',
  '....0qqqqqq0....',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '...0qqqqqqqq0...',
  '....0qqqqqq0....',
  '...0kkkkkkkk0...',
  '..01kkkkkkkk10..',
  '..01kkkkkkkk10..',
  '...0llllllll0...',
  '...0mmmmmmmm0...',
  '...0mmm00mmm0...',
  '...0bb00bb0.....',
  '....000000......',
];

// Vue de cote : Night regarde a DROITE.
// La version "gauche" est fabriquee automatiquement en miroir.
export const NIGHT_COTE_0 = [
  '................',
  '....000000......',
  '...0qqqqqq0.....',
  '..0qqqqqqqq0....',
  '..0qq1111110....',
  '..0q11o11110....',
  '..0qq1111110....',
  '...01111110.....',
  '..0kkkkkkkk0....',
  '..0kkkkkkk10....',
  '..0kkkkkkk10....',
  '..0llllllll0....',
  '..0mmmmmmmm0....',
  '...0mmmmmm0.....',
  '....0bbbb0......',
  '....000000......',
];

export const NIGHT_COTE_1 = [
  '................',
  '....000000......',
  '...0qqqqqq0.....',
  '..0qqqqqqqq0....',
  '..0qq1111110....',
  '..0q11o11110....',
  '..0qq1111110....',
  '...01111110.....',
  '..0kkkkkkkk0....',
  '..0kkkkkkk10....',
  '..0kkkkkkk10....',
  '..0llllllll0....',
  '..0mmmmmmmm0....',
  '..0mmmmmm0......',
  '...0bbbb0.......',
  '...000000.......',
];

/** L'epee, pointe vers le haut (5 x 12). Elle est tournee selon la direction. */
export const EPEE = [
  '..6..',
  '..6..',
  '.666.',
  '.666.',
  '.666.',
  '.666.',
  '.696.',
  '.999.',
  'eeeee',
  '..b..',
  '..b..',
  '..b..',
];

/* --------------------------------------------------------------------- */
/* LES ENNEMIS (16 x 16)                                                  */
/* --------------------------------------------------------------------- */

export const GLUANT_0 = [
  '................',
  '................',
  '................',
  '.....000000.....',
  '....03333330....',
  '...0333333330...',
  '...0303303030...',
  '..033333333330..',
  '..033333333330..',
  '..033033330330..',
  '..033333333330..',
  '..033333333330..',
  '..030333333030..',
  '..000000000000..',
  '................',
  '................',
];

export const GLUANT_1 = [
  '................',
  '................',
  '....000000......',
  '...03333330.....',
  '..0333333330....',
  '..0303303030....',
  '.033333333330...',
  '.033333333330...',
  '.033033330330...',
  '.033333333330...',
  '.033333333330...',
  '.033333333330...',
  '.030333333030...',
  '.000000000000...',
  '................',
  '................',
];

export const CHAUVE_SOURIS_0 = [
  '................',
  '................',
  '.0............0.',
  '.0d0........0d0.',
  '.0dd0..00..0dd0.',
  '.0ddd0d00d0ddd0.',
  '..0dddddddddd0..',
  '...0dd8dd8dd0...',
  '...0dddddddd0...',
  '....0d0000d0....',
  '.....00..00.....',
  '................',
  '................',
  '................',
  '................',
  '................',
];

export const CHAUVE_SOURIS_1 = [
  '................',
  '................',
  '................',
  '.......00.......',
  '......0dd0......',
  '.0000d0dd0d0000.',
  '.0dddddddddddd0.',
  '.0dd0dd8dd8dd0..',
  '..00.0dddddd0...',
  '......0d00d0....',
  '.......0..0.....',
  '................',
  '................',
  '................',
  '................',
  '................',
];

export const SQUELETTE_0 = [
  '................',
  '.....00000......',
  '....0666660.....',
  '....0606060.....',
  '....0666660.....',
  '.....06660......',
  '....0069600.....',
  '...066666660....',
  '...060666060....',
  '...066666660....',
  '....0666660.....',
  '....06060600....',
  '....06060 0.....',
  '...066006600....',
  '...000..000.....',
  '................',
];

export const SQUELETTE_1 = [
  '................',
  '.....00000......',
  '....0666660.....',
  '....0606060.....',
  '....0666660.....',
  '.....06660......',
  '....0069600.....',
  '..0066666600....',
  '..060666060.....',
  '...066666660....',
  '....0666660.....',
  '....06060600....',
  '....06060 0.....',
  '....0660660.....',
  '....000.000.....',
  '................',
];

/** Le boss : un gros gluant couronne (dessine en 16x16, affiche en double). */
export const ROI_GLUANT = [
  '.....e....e.....',
  '....eee..eee....',
  '...eeeeeeeeee...',
  '...0eeeeeeee0...',
  '..0d00dddd00d0..',
  '.0dddddddddddd0.',
  '.0d08dd00dd80d0.',
  '0dddddddddddddd0',
  '0dddd000000dddd0',
  '0ddd06dddd60ddd0',
  '0dddd000000dddd0',
  '0dddddddddddddd0',
  '.0dddddddddddd0.',
  '.0dddddddddddd0.',
  '..000000000000..',
  '................',
];

/* --------------------------------------------------------------------- */
/* LES PERSONNAGES AMIS (16 x 16)                                         */
/* --------------------------------------------------------------------- */

export const VILLAGEOIS_0 = [
  '................',
  '.....00000......',
  '....0bbbbb0.....',
  '...0bbbbbbb0....',
  '...0b111111 0...',
  '...0b101101b0...',
  '...0b111111b0...',
  '....01111110....',
  '...077777770....',
  '..01777777710...',
  '..01777777710...',
  '...0777777770...',
  '...0777777770...',
  '....0bb00bb0....',
  '....0bb00bb0....',
  '....00000000....',
];

export const VIEUX_SAGE = [
  '................',
  '.....00000......',
  '....0ddddd0.....',
  '...0ddddddd0....',
  '...0d111111d0...',
  '...0d101101d0...',
  '...0d111111d0...',
  '....06666660....',
  '...066666660....',
  '..0d66666660d0..',
  '..0dd666666dd0..',
  '...0dddddddd0...',
  '...0dddddddd0...',
  '....0dddddd0....',
  '....0dddddd0....',
  '....00000000....',
];

/* --------------------------------------------------------------------- */
/* LES OBJETS (8 x 8 ou 16 x 16)                                          */
/* --------------------------------------------------------------------- */

export const COEUR = [
  '.88..88.',
  '8888888.',
  '88888888',
  '.888888.',
  '..8888..',
  '...88...',
  '........',
  '........',
];

export const RUBIS = [
  '...ee...',
  '..e33e..',
  '.e3333e.',
  'e333333e',
  '.e3333e.',
  '..e33e..',
  '...ee...',
  '........',
];

export const CLE = [
  '..eee...',
  '.e...e..',
  '.e...e..',
  '..eee...',
  '...e....',
  '...ee...',
  '...e....',
  '...ee...',
];

export const CLE_BOSS = [
  '.dddd...',
  'd8888d..',
  'd8..8d..',
  '.dddd...',
  '...d....',
  '...dd...',
  '...d....',
  '...ddd..',
];

export const BOMBE = [
  '.....e..',
  '....e...',
  '..aaa...',
  '.aaaaa..',
  'aaaaaaa.',
  'aaaaaaa.',
  '.aaaaa..',
  '..aaa...',
];

export const POTION = [
  '..666...',
  '..6.6...',
  '.66666..',
  '.68886..',
  '.68886..',
  '.68886..',
  '.66666..',
  '..000...',
];

export const FLECHE = [
  '........',
  '...b....',
  '..b9....',
  'bbbb999.',
  '..b9....',
  '...b....',
  '........',
  '........',
];

export const BOULE_MAGIE = [
  '..dd....',
  '.dggd...',
  'dggggd..',
  'dggggd..',
  '.dggd...',
  '..dd....',
  '........',
  '........',
];

export const ICONE_ARC = [
  '..bb....',
  '.b..6...',
  'b...6...',
  'b...6...',
  'b...6...',
  '.b..6...',
  '..bb....',
  '........',
];

export const ICONE_EPEE = [
  '.....66.',
  '....66..',
  '...66...',
  '..66....',
  '.e6.....',
  'eeb.....',
  '.b......',
  '........',
];

export const ICONE_BOUCLIER = [
  '.999999.',
  '.988889.',
  '.988889.',
  '.999999.',
  '..9999..',
  '...99...',
  '........',
  '........',
];

export const COFFRE_FERME = [
  '................',
  '................',
  '...00000000000..',
  '..0bbbbbbbbbb0..',
  '..0bhhhhhhhhb0..',
  '..0bbbbbbbbbb0..',
  '..0eeeeeeeeee0..',
  '..0bbbb00bbbb0..',
  '..0bhhb00bhhhb..',
  '..0bhhbeebhhhb..',
  '..0bhhhhhhhhb0..',
  '..0bbbbbbbbbb0..',
  '..000000000000..',
  '................',
  '................',
  '................',
];

export const COFFRE_OUVERT = [
  '................',
  '..0bbbbbbbbbb0..',
  '..0b00000000b0..',
  '..0b0iiiiii0b0..',
  '..0b00000000b0..',
  '..0bbbbbbbbbb0..',
  '..0iiiiiiiiii0..',
  '..0eeeeeeeeee0..',
  '..0bhhhhhhhhb0..',
  '..0bhhhhhhhhb0..',
  '..0bhhhhhhhhb0..',
  '..0bbbbbbbbbb0..',
  '..000000000000..',
  '................',
  '................',
  '................',
];

/** Une petite etincelle pour les objets magiques. */
export const ETINCELLE = [
  '...6....',
  '..666...',
  '.66666..',
  '6666666.',
  '.66666..',
  '..666...',
  '...6....',
  '........',
];

/**
 * Le catalogue : nom utilise dans le jeu -> dessin.
 * Ajoute ton propre dessin ici et il sera disponible partout !
 */
export const SPRITES = {
  heros_bas_0: NIGHT_BAS_0,
  heros_bas_1: NIGHT_BAS_1,
  heros_haut_0: NIGHT_HAUT_0,
  heros_haut_1: NIGHT_HAUT_1,
  heros_droite_0: NIGHT_COTE_0,
  heros_droite_1: NIGHT_COTE_1,
  epee: EPEE,
  gluant_0: GLUANT_0,
  gluant_1: GLUANT_1,
  chauve_souris_0: CHAUVE_SOURIS_0,
  chauve_souris_1: CHAUVE_SOURIS_1,
  squelette_0: SQUELETTE_0,
  squelette_1: SQUELETTE_1,
  roi_gluant_0: ROI_GLUANT,
  villageois_0: VILLAGEOIS_0,
  sage_0: VIEUX_SAGE,
  coeur: COEUR,
  rubis: RUBIS,
  cle: CLE,
  cle_boss: CLE_BOSS,
  bombe: BOMBE,
  potion: POTION,
  fleche: FLECHE,
  boule_magie: BOULE_MAGIE,
  icone_arc: ICONE_ARC,
  icone_epee: ICONE_EPEE,
  icone_bouclier: ICONE_BOUCLIER,
  coffre_ferme: COFFRE_FERME,
  coffre_ouvert: COFFRE_OUVERT,
  etincelle: ETINCELLE,
};
