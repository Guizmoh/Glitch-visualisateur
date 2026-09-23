/* =========================================================================
   particules.js — Les petits effets qui rendent le jeu vivant :
   etincelles, feuilles coupees, poussiere, explosion...
   ========================================================================= */

import { hasard, auHasard } from './maths.js';
import { rect } from './rendu.js';

export class SystemeParticules {
  constructor(maximum = 260) {
    this.particules = [];
    this.maximum = maximum;
  }

  /** Cree une gerbe de particules. */
  emettre(x, y, options = {}) {
    const {
      nombre = 8,
      couleurs = ['#ffffff'],
      vitesse = [20, 70],
      duree = [0.25, 0.6],
      taille = [1, 3],
      gravite = 0,
      direction = null, // en radians, sinon tout autour
      ouverture = Math.PI * 2,
    } = options;

    for (let i = 0; i < nombre; i++) {
      if (this.particules.length >= this.maximum) this.particules.shift();
      const angle = direction === null
        ? hasard(0, Math.PI * 2)
        : direction + hasard(-ouverture / 2, ouverture / 2);
      const v = hasard(vitesse[0], vitesse[1]);
      this.particules.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        vie: hasard(duree[0], duree[1]),
        vieMax: duree[1],
        taille: Math.round(hasard(taille[0], taille[1])),
        couleur: auHasard(couleurs),
        gravite,
      });
    }
  }

  maj(dt) {
    for (let i = this.particules.length - 1; i >= 0; i--) {
      const p = this.particules[i];
      p.vie -= dt;
      if (p.vie <= 0) {
        this.particules.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravite * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  dessiner(ctx) {
    for (const p of this.particules) {
      ctx.globalAlpha = Math.min(1, p.vie * 3);
      rect(ctx, p.x - p.taille / 2, p.y - p.taille / 2, p.taille, p.taille, p.couleur);
    }
    ctx.globalAlpha = 1;
  }

  vider() {
    this.particules.length = 0;
  }
}

/** Effets tout prets, pour aller plus vite. */
export const EFFETS = {
  coupHerbe: { nombre: 10, couleurs: ['#5fcf6a', '#2e8a4b', '#9ae66e'], vitesse: [30, 90], gravite: 160, duree: [0.3, 0.6] },
  poussiere: { nombre: 6, couleurs: ['#c9b89a', '#a08f74'], vitesse: [10, 40], duree: [0.2, 0.4] },
  sang: { nombre: 10, couleurs: ['#d94a4a', '#8a2a2a'], vitesse: [30, 100], duree: [0.25, 0.5] },
  etincelle: { nombre: 8, couleurs: ['#ffffff', '#f2c14b'], vitesse: [40, 110], duree: [0.15, 0.35] },
  explosion: { nombre: 28, couleurs: ['#f2c14b', '#ef6c2e', '#d94a4a', '#ffffff'], vitesse: [60, 200], duree: [0.3, 0.7] },
  eau: { nombre: 8, couleurs: ['#7ec8f2', '#4a90d9', '#ffffff'], vitesse: [20, 60], gravite: 120, duree: [0.2, 0.45] },
  magie: { nombre: 12, couleurs: ['#c58af2', '#8a5ad9', '#ffffff'], vitesse: [20, 70], duree: [0.3, 0.7] },
  pierre: { nombre: 12, couleurs: ['#9aa0b0', '#5b6070', '#c9c9c9'], vitesse: [30, 90], gravite: 180, duree: [0.3, 0.6] },
};
