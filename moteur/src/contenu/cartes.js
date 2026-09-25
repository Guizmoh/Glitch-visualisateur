/* =========================================================================
   cartes.js — LE MONDE DU JEU, salle par salle.
   Une salle = un ecran de 20 cases sur 12.

   Le decor s'ecrit avec les lettres de contenu/tuiles.js :
     .  herbe      ,  fleurs      :  chemin      _  sable
     T  arbre      o  buisson     %  rocher      ~  eau
     #  mur        W  mur donjon  F  sol donjon  p  pot
     ^  pics       x  trou        D  porte a cle B  porte du boss
     S  escalier   I  dalle       V  grille      c  cristal   !  torche

   sorties  : ou on arrive en sortant par un bord de l'ecran.
              Attention : l'ouverture doit exister DES DEUX COTES,
              au meme endroit !
   entites  : les ennemis, coffres, personnages... en CASES (x, y).
   passages : les escaliers et grottes (fondu au noir).
   verrou   : 'ennemis' = les grilles V s'ouvrent quand la salle est nettoyee.
   recompense : l'objet qui apparait quand tous les ennemis sont vaincus.
   ========================================================================= */

export const CARTES = {
  /* ================== LA MAISON DE NIGHT (depart) =================== */
  // Night se reveille ici, seul, sans aucun souvenir. Voir SCENARIO.md.
  // Le toit est creve, les meubles sont renverses, et il y a des traces
  // enormes sur le plancher. On ne dit rien : on montre.
  'maison-night': {
    titre: 'Chez toi... ?',
    musique: null,
    fond: '#140f0b',
    decor: [
      'MMMMMMMMMMMM&MMMMMMM',
      'MPPPPPPPPPPPPPP&PPPM',
      'MPiPPPPPPPgPPPPPPPPM',
      'MPPPPPPPPPgPPPPP&PPM',
      'MPPPP&PPPPgPPPPPPPPM',
      'MPPPPPPPPPPPzPPPPPPM',
      'MPPPPPPPPPPPPPP&PPPM',
      'MP&PPPPgPPPPPPPPPPPM',
      'MPPPPPPgPPPPPPPPPPPM',
      'MPPPPPPgPPPP&PPPPPPM',
      'MPPPPPPPPPPPPPPPPPPM',
      'MMMMMMMMMEEMMMMMMMMM',
    ],
    passages: [
      { x: 9, y: 11, vers: 'village', arrivee: [14, 4] },
      { x: 10, y: 11, vers: 'village', arrivee: [14, 4] },
    ],
    entites: [],
  },

  /* ================== LE VILLAGE (depart) ========================== */
  village: {
    titre: 'Village de Feuillebois',
    musique: 'village',
    fond: '#2a4a2e',
    decor: [
      'TTTTTTTT..TTTTTTTTTT',
      'T...........MMMMMM.T',
      'T...o.......M&PP&M.T',
      'T.,....:::::MMEMMM.T',
      'T......:...:.......T',
      'T......:...:........',
      'T......:::::........',
      'T..o......%........T',
      'T........,....o....T',
      'T..................T',
      'T...TT......TT.....T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    sorties: { est: 'plaine', nord: 'bois' },
    passages: [
      { x: 14, y: 3, vers: 'maison-night', arrivee: [9, 10] },
    ],
    entites: [
      { type: 'pnj', dialogue: 'pypa', sprite: 'sage_0', x: 9, y: 4, nom: 'Pypa' },
      { type: 'pnj', dialogue: 'villageois', sprite: 'villageois_0', x: 4, y: 8, errant: true },
      { type: 'pnj', dialogue: 'marchande', sprite: 'villageois_0', x: 14, y: 3, errant: false },
      { type: 'panneau', x: 8, y: 9, texte: ['Village de Feuillebois.', 'Le donjon est au nord-est.'] },
      { type: 'coffre', x: 2, y: 2, contenu: 'rubis_bleu', drapeau: 'coffre-village' },
    ],
  },

  /* ================== LE BOIS ====================================== */
  bois: {
    titre: 'Le Petit Bois',
    musique: 'foret',
    fond: '#1d3320',
    decor: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T...TT........TT...T',
      'T.....T....T.......T',
      'T..T.......T...TT..T',
      'T....%.........T...T',
      'T..TT....TT........T',
      'T.......T..........T',
      'T...TT.......TT....T',
      'T........o.o.......T',
      'T..T...........T...T',
      'T.......T..T.......T',
      'TTTTTTTT..TTTTTTTTTT',
    ],
    sorties: { sud: 'village' },
    entites: [
      { type: 'ennemi', espece: 'chauve_souris', x: 6, y: 3 },
      { type: 'ennemi', espece: 'chauve_souris', x: 14, y: 6 },
      { type: 'ennemi', espece: 'gluant', x: 9, y: 6 },
      { type: 'coffre', x: 10, y: 2, contenu: 'bombes', drapeau: 'coffre-bombes' },
      { type: 'panneau', x: 9, y: 10, texte: ['Attention : chauves-souris !'] },
    ],
  },

  /* ================== LA PLAINE ==================================== */
  plaine: {
    titre: 'Plaine de l\'Est',
    musique: 'village',
    fond: '#2a4a2e',
    decor: [
      'TTTTTTTT..TTTTTTTTTT',
      'T..........TTTTTTTTT',
      'T....o.....T.......T',
      'T..........T.......T',
      'T...%......TTT%TTTTT',
      '.........:::.......T',
      '.......:::.........T',
      'T..o.......%.......T',
      'T.......,..........T',
      'T...o..........o...T',
      'T.....TT....TT.....T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    sorties: { ouest: 'village', nord: 'entree-donjon' },
    entites: [
      { type: 'ennemi', espece: 'gluant', x: 5, y: 8 },
      { type: 'ennemi', espece: 'gluant', x: 13, y: 8 },
      { type: 'ennemi', espece: 'squelette', x: 8, y: 3 },
      { type: 'coffre', x: 15, y: 3, contenu: 'arc', drapeau: 'coffre-arc' },
      { type: 'panneau', x: 3, y: 5, texte: ['Un rocher fissure...', 'Une bombe en viendrait a bout !'] },
    ],
  },

  /* ================== DEVANT LE DONJON ============================= */
  'entree-donjon': {
    titre: 'Temple oublie',
    musique: 'foret',
    fond: '#23252f',
    decor: [
      '####################',
      '#..................#',
      '#.....########.....#',
      '#.....#......#.....#',
      '#.....#..SS..#.....#',
      '#.....#......#.....#',
      '#.....###..###.....#',
      '#.........,........#',
      '#..%............%..#',
      '#..................#',
      '#........::........#',
      '########..##########',
    ],
    sorties: { sud: 'plaine' },
    passages: [
      { x: 9, y: 4, vers: 'donjon-1', arrivee: [9, 9] },
      { x: 10, y: 4, vers: 'donjon-1', arrivee: [9, 9] },
    ],
    entites: [
      { type: 'pnj', dialogue: 'gardien', sprite: 'villageois_0', x: 5, y: 9 },
      { type: 'ennemi', espece: 'chauve_souris', x: 15, y: 3 },
      { type: 'panneau', x: 13, y: 7, texte: ['Donjon du Roi Gluant.', 'Entre si tu l\'oses.'] },
    ],
  },

  /* ================== DONJON : SALLE 1 ============================= */
  'donjon-1': {
    titre: 'Donjon - Entree',
    musique: 'donjon',
    fond: '#15131f',
    verrou: 'ennemis',
    decor: [
      'WWWWWWWWWDWWWWWWWWWW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFWWWWWFFFFWWWWWFFW',
      'WFFWFFFWFFFFWFFFWFFW',
      'WFFWFFFVFFFFVFFFWFFW',
      'WFFWWWWWFFFFWWWWWFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFpFFFFFFFFFFFFpFFW',
      'WFFFF^FFFFFF^FFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WWWWWWWWWSWWWWWWWWWW',
    ],
    sorties: { nord: 'donjon-2' },
    passages: [
      { x: 9, y: 11, vers: 'entree-donjon', arrivee: [9, 5] },
    ],
    entites: [
      { type: 'ennemi', espece: 'gluant', x: 6, y: 7 },
      { type: 'ennemi', espece: 'gluant', x: 13, y: 9 },
      { type: 'ennemi', espece: 'squelette', x: 9, y: 6 },
      { type: 'coffre', x: 5, y: 3, contenu: 'cle', drapeau: 'coffre-cle-1' },
      { type: 'coffre', x: 14, y: 3, contenu: 'munition_bombe', quantite: 2, drapeau: 'coffre-bombes-2' },
      { type: 'panneau', x: 3, y: 10, texte: ['Les grilles s\'ouvrent quand', 'la salle est nettoyee.'] },
    ],
  },

  /* ================== DONJON : SALLE 2 (puzzle) ==================== */
  'donjon-2': {
    titre: 'Donjon - Salle de la dalle',
    musique: 'donjon',
    fond: '#15131f',
    decor: [
      'WWWWWWWWWBWWWWWWWWWW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFWWWWWWWWWWWWWWFFW',
      'WFFWFFFFFFFFFFFFWFFW',
      'WFFWFFFFFFFFFFFFWFFW',
      'WFFWWWWWWVWWWWWWWFFW',
      'WFFFFFFFFIFFFFFFFFFW',
      'WFF^FFFFFFFFFFFF^FFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WWWWWWWWWFWWWWWWWWWW',
    ],
    sorties: { sud: 'donjon-1', nord: 'salle-boss' },
    entites: [
      { type: 'bloc', x: 12, y: 9 },
      { type: 'bloc', x: 6, y: 9 },
      { type: 'ennemi', espece: 'squelette_archer', x: 4, y: 10 },
      { type: 'ennemi', espece: 'chauve_souris', x: 15, y: 10 },
      { type: 'coffre', x: 9, y: 4, contenu: 'cle_boss', drapeau: 'coffre-cle-boss' },
      { type: 'panneau', x: 14, y: 7, texte: ['Pose quelque chose de lourd', 'sur la dalle...'] },
    ],
  },

  /* ================== LA SALLE DU BOSS ============================= */
  'salle-boss': {
    titre: 'Antre du Roi Gluant',
    musique: 'boss',
    fond: '#1a1128',
    verrou: 'ennemis',
    recompense: { objet: 'fragment', x: 9, y: 6 },
    decor: [
      'WWWWWWWWWWWWWWWWWWWW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WF!FFFFFFFFFFFFFF!FW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WF!FFFFFFFFFFFFFF!FW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WWWWWWWWWFWWWWWWWWWW',
    ],
    sorties: { sud: 'donjon-2' },
    entites: [
      { type: 'ennemi', espece: 'roi_gluant', x: 9, y: 4, drapeau: 'boss-vaincu' },
    ],
  },
};
