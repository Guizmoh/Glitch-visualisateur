/* =========================================================================
   transitions.js — Les fondus au noir et les glissements entre les salles.
   ========================================================================= */

import { rect } from '../noyau/rendu.js';

export class Fondu {
  constructor(largeur, hauteur) {
    this.largeur = largeur;
    this.hauteur = hauteur;
    this.opacite = 0;
    this.cible = 0;
    this.vitesse = 3;
    this.surNoir = null;
    this.actif = false;
  }

  /** Ferme l'ecran, execute une action, puis rouvre. */
  fermerPuis(action, vitesse = 4) {
    this.vitesse = vitesse;
    this.cible = 1;
    this.actif = true;
    this.surNoir = action;
  }

  ouvrir(vitesse = 4) {
    this.vitesse = vitesse;
    this.cible = 0;
    this.actif = true;
  }

  maj(dt) {
    if (!this.actif) return;
    if (this.opacite < this.cible) {
      this.opacite = Math.min(this.cible, this.opacite + this.vitesse * dt);
      if (this.opacite >= 1 && this.surNoir) {
        const action = this.surNoir;
        this.surNoir = null;
        action();
        this.ouvrir(this.vitesse);
      }
    } else if (this.opacite > this.cible) {
      this.opacite = Math.max(this.cible, this.opacite - this.vitesse * dt);
      if (this.opacite <= 0) this.actif = false;
    }
  }

  get enCours() {
    return this.actif && (this.opacite > 0 || this.cible > 0);
  }

  dessiner(ctx) {
    if (this.opacite <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.opacite;
    rect(ctx, 0, 0, this.largeur, this.hauteur, '#000000');
    ctx.restore();
  }
}
