/* =========================================================================
   scene.js — Une "scene" est un grand morceau du jeu :
   l'ecran-titre, la partie, le game over, le menu de pause...
   Le moteur empile les scenes : la pause se dessine PAR-DESSUS le jeu.
   ========================================================================= */

export class Scene {
  constructor(nom = 'scene') {
    this.nom = nom;
    this.moteur = null;
    /** Si vrai, la scene juste en dessous continue d'etre dessinee. */
    this.transparente = false;
    /** Si vrai, la scene en dessous continue aussi de se mettre a jour. */
    this.laisseTournerDessous = false;
  }

  /** Appele quand la scene arrive a l'ecran. */
  entrer(donnees = {}) {}

  /** Appele quand la scene est retiree. */
  sortir() {}

  /** Appele ~60 fois par seconde. dt = temps ecoule en secondes. */
  maj(dt) {}

  /** Dessine la scene. */
  dessiner(ctx) {}

  /* Raccourcis pratiques --------------------------------------------- */
  get entrees() {
    return this.moteur.entrees;
  }

  get ecran() {
    return this.moteur.ecran;
  }
}
