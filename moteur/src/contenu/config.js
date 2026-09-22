/* =========================================================================
   config.js — LES REGLAGES DU JEU.
   C'est le premier fichier a bidouiller : chaque nombre change le ressenti.
   Essaie de mettre vitesseHeros a 150 pour voir !
   ========================================================================= */

export const CONFIG = {
  /* --- Identite ---------------------------------------------------- */
  titre: 'La Legende du Fragment',
  sousTitre: 'un petit Zelda-like a fabriquer soi-meme',

  /* --- Ecran ------------------------------------------------------- */
  largeurEcran: 320, // en pixels (20 cases de 16)
  hauteurEcran: 192, // en pixels (12 cases de 16)

  /* --- Le heros ---------------------------------------------------- */
  vieDepart: 6, // en DEMI-coeurs : 6 = 3 coeurs
  vitesseHeros: 78, // pixels par seconde
  dureeAttaque: 0.22, // duree du coup d'epee
  rechargeAttaque: 0.3, // temps avant de pouvoir refrapper
  degatsEpee: 2,
  degatsFleche: 2,
  degatsChute: 1, // quand on tombe dans un trou
  tempsAvantPoussee: 0.35, // temps a pousser un bloc avant qu'il bouge

  /* --- Monde ------------------------------------------------------- */
  salleDepart: 'village',
  positionDepart: { x: 147, y: 131 }, // case (9, 8) du village
  dureeTransition: 0.45, // glissement d'une salle a l'autre

  objetDeVictoire: 'fragment', // ramasser cet objet termine le jeu

  /* --- Divers ------------------------------------------------------ */
  vitesseTexte: 34, // lettres par seconde dans les dialogues
  montrerFps: false,
  sauvegardeAuto: true,
};
