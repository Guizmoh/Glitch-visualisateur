/* =========================================================================
   ennemis.js — LE BESTIAIRE.
   Une fiche par ennemi. Copie une fiche, change le nom, le dessin, les
   points de vie... et ton monstre existe !

   Champs utiles :
     pv        : points de vie en demi-coeurs (4 = 2 coeurs)
     vitesse   : pixels par seconde
     degats    : demi-coeurs enleves au heros quand il touche
     ia        : 'errant' | 'poursuite' | 'sauteur' | 'volant' | 'patrouille'
                 | 'tireur' | 'chargeur' | 'immobile' | 'boss_gluant'
     sprite    : prefixe des images (sprite_0, sprite_1)
     butin     : ce qu'il laisse tomber ; null = butin normal du jeu
   ========================================================================= */

export const ENNEMIS = {
  gluant: {
    nom: 'Gluant',
    pv: 4, vitesse: 26, degats: 1,
    ia: 'sauteur', sprite: 'gluant',
    largeur: 12, hauteur: 9,
    couleursMort: ['#57c96a', '#2f8f4a', '#ffffff'],
  },

  gluant_rouge: {
    nom: 'Gluant de feu',
    pv: 6, vitesse: 34, degats: 2,
    ia: 'poursuite', sprite: 'gluant',
    teinte: '#e04a4a',
    largeur: 12, hauteur: 9,
    couleursMort: ['#e04a4a', '#f2c14b'],
    butin: [{ objet: 'coeur', chance: 0.4 }, { objet: 'rubis_bleu', chance: 0.3 }],
  },

  chauve_souris: {
    nom: 'Chauve-souris',
    pv: 2, vitesse: 58, degats: 1,
    ia: 'volant', sprite: 'chauve_souris',
    largeur: 12, hauteur: 8, portee: 120,
    vitesseAnimation: 9,
    couleursMort: ['#8a5ad9', '#c58af2'],
  },

  squelette: {
    nom: 'Squelette',
    pv: 6, vitesse: 40, degats: 1,
    ia: 'poursuite', sprite: 'squelette',
    largeur: 11, hauteur: 10, portee: 110,
    couleursMort: ['#f4f1de', '#a8aec0'],
    butin: [{ objet: 'coeur', chance: 0.3 }, { objet: 'rubis', chance: 0.5 }],
  },

  squelette_archer: {
    nom: 'Squelette archer',
    pv: 4, vitesse: 34, degats: 1,
    ia: 'tireur', sprite: 'squelette',
    projectile: 'fleche', degatsProjectile: 1, cadence: 1.6,
    largeur: 11, hauteur: 10,
    couleursMort: ['#f4f1de', '#a8aec0'],
  },

  garde_gluant: {
    nom: 'Garde gluant',
    pv: 8, vitesse: 30, degats: 2,
    ia: 'chargeur', sprite: 'gluant',
    largeur: 13, hauteur: 10, echelle: 1.2,
    couleursMort: ['#57c96a', '#2f8f4a'],
  },

  sentinelle: {
    nom: 'Sentinelle',
    pv: 5, vitesse: 45, degats: 1,
    ia: 'patrouille', sprite: 'squelette',
    axe: 'horizontal',
    largeur: 11, hauteur: 10,
  },

  /* --- LE BOSS ----------------------------------------------------- */
  roi_gluant: {
    nom: 'Roi Gluant',
    boss: true,
    pv: 24, vitesse: 40, degats: 2,
    ia: 'boss_gluant', sprite: 'roi_gluant',
    images: ['roi_gluant_0'],
    largeur: 26, hauteur: 20, echelle: 2,
    decalageSpriteY: 4,
    forceRecul: 60, ignoreRecul: true,
    dureeInvincibilite: 0.5,
    couleursMort: ['#8a5ad9', '#c58af2', '#ffffff'],
    drapeau: 'boss-vaincu',
    butin: [{ objet: 'coeur_max', chance: 1 }],
  },
};
