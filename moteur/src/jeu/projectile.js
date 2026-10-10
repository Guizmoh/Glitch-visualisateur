/* =========================================================================
   projectile.js — Tout ce qui vole : fleches, boules de feu, bombes.
   ========================================================================= */

import { Entite } from './entite.js';
import { collisionDecor } from './physique.js';
import { explosion } from './combat.js';

export class Projectile extends Entite {
  constructor(options = {}) {
    super({
      largeur: 6, hauteur: 6, ombre: false, ...options, type: options.type || 'projectile',
    });
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.degats = options.degats ?? 1;
    this.dureeVie = options.dureeVie ?? 2.5;
    this.forceRecul = options.forceRecul ?? 120;
    this.traverseMurs = options.traverseMurs ?? false;
    this.effetImpact = options.effetImpact || 'etincelle';
    this.proprietaire = options.proprietaire || null;
    this.rotation = options.rotation ?? true;
  }

  maj(dt, scene) {
    this.dureeVie -= dt;
    if (this.dureeVie <= 0) {
      this.detruire();
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Contre un mur ?
    if (!this.traverseMurs && collisionDecor(this, scene.carte)) {
      this.impact(scene);
      return;
    }

    // Contre une entite de l'equipe adverse ?
    for (const cible of scene.entites) {
      if (!cible.vivante || cible === this.proprietaire) continue;
      if (cible.equipe === this.equipe || cible.equipe === 'neutre') continue;
      if (typeof cible.subirDegats !== 'function') continue;
      if (!this.touche(cible)) continue;
      // Le bouclier du heros arrete les projectiles de face.
      if (cible.bloqueProjectile && cible.bloqueProjectile(this)) {
        scene.audio.jouer('bloc');
        scene.particules.emettre(this.centreX, this.centreY, { nombre: 6, couleurs: ['#ffffff', '#a8aec0'] });
        this.detruire();
        return;
      }
      cible.subirDegats(this.degats, this, scene);
      this.impact(scene);
      return;
    }
  }

  impact(scene) {
    const effets = {
      etincelle: { nombre: 8, couleurs: ['#ffffff', '#f2c14b'] },
      magie: { nombre: 10, couleurs: ['#c58af2', '#8a5ad9', '#ffffff'] },
      pierre: { nombre: 8, couleurs: ['#9aa0b0', '#5b6070'] },
    };
    scene.particules.emettre(this.centreX, this.centreY, effets[this.effetImpact] || effets.etincelle);
    this.detruire();
  }

  dessiner(ctx, scene) {
    const image = scene.atlas.image(this.sprite);
    if (!image) return;
    ctx.save();
    ctx.translate(Math.round(this.centreX), Math.round(this.centreY));
    if (this.rotation) ctx.rotate(Math.atan2(this.vy, this.vx));
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  }
}

/** La bombe : elle se pose, clignote, puis explose. */
export class Bombe extends Entite {
  constructor(options = {}) {
    super({
      largeur: 10, hauteur: 8, sprite: 'bombe', solide: false, ...options, type: 'bombe',
    });
    this.minuterie = options.minuterie ?? 1.6;
    this.degats = options.degats ?? 2;
    this.equipe = options.equipe || 'joueur';
  }

  maj(dt, scene) {
    this.minuterie -= dt;
    // Clignote de plus en plus vite.
    const rythme = this.minuterie < 0.5 ? 16 : 8;
    this.flash = Math.floor(this.minuterie * rythme) % 2 === 0 ? 0.1 : 0;
    if (this.minuterie <= 0) {
      explosion(this.centreX, this.centreY, scene, { degats: this.degats, equipe: this.equipe });
      this.detruire();
    }
  }
}
