/* =========================================================================
   combat.js — Les coups qui font mal.
   Une "ZoneDegats" est un rectangle invisible qui vit une fraction de
   seconde : c'est le coup d'epee, l'explosion d'une bombe, le souffle du
   boss... Tout ce qui touche la zone prend des degats.
   ========================================================================= */

import { Entite } from './entite.js';
import { TAILLE_TUILE } from '../monde/tuileset.js';

export class ZoneDegats extends Entite {
  constructor(options = {}) {
    super({ ...options, type: 'zone-degats', ombre: false });
    this.degats = options.degats ?? 1;
    this.equipe = options.equipe || 'joueur';
    this.duree = options.duree ?? 0.15;
    this.forceRecul = options.forceRecul ?? 150;
    this.proprietaire = options.proprietaire || null;
    this.casseTuiles = options.casseTuiles || null; // 'epee' | 'bombe'
    this.dejaTouches = new Set();
    this.unSeulCoup = options.unSeulCoup ?? true;
    this.visible = options.visible ?? false;
  }

  maj(dt, scene) {
    this.duree -= dt;
    if (this.duree <= 0) {
      this.detruire();
      return;
    }

    // 1. Les entites touchees
    for (const cible of scene.entites) {
      if (!cible.vivante || cible === this.proprietaire) continue;
      if (cible.equipe === this.equipe || cible.equipe === 'neutre') continue;
      if (typeof cible.subirDegats !== 'function') continue;
      if (this.unSeulCoup && this.dejaTouches.has(cible.id)) continue;
      if (!this.touche(cible)) continue;
      this.dejaTouches.add(cible.id);
      const touche = cible.subirDegats(this.degats, this, scene);
      if (touche && scene.surCoupPorte) scene.surCoupPorte(this, cible);
    }

    // 2. Le decor cassable (buissons a l'epee, rochers a la bombe)
    if (this.casseTuiles && scene.carte) {
      const colonneMin = Math.floor(this.x / TAILLE_TUILE);
      const colonneMax = Math.floor((this.x + this.largeur) / TAILLE_TUILE);
      const ligneMin = Math.floor(this.y / TAILLE_TUILE);
      const ligneMax = Math.floor((this.y + this.hauteur) / TAILLE_TUILE);
      for (let ligne = ligneMin; ligne <= ligneMax; ligne++) {
        for (let col = colonneMin; col <= colonneMax; col++) {
          const casse = scene.carte.casser(col, ligne, this.casseTuiles);
          if (casse && scene.surTuileCassee) scene.surTuileCassee(casse);
        }
      }
    }
  }

  dessiner(ctx, scene) {
    if (!this.visible) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x, this.y, this.largeur, this.hauteur);
    ctx.restore();
  }
}

/**
 * Cree une zone de degats devant une entite (coup d'epee).
 */
export function coupDevant(source, scene, options = {}) {
  const portee = options.portee ?? 14;
  const epaisseur = options.epaisseur ?? 16;
  let x = source.centreX;
  let y = source.centreY;
  let l = epaisseur;
  let h = portee;

  switch (source.direction) {
    case 'haut':
      l = epaisseur; h = portee;
      x = source.centreX - l / 2; y = source.y - portee + 2;
      break;
    case 'bas':
      l = epaisseur; h = portee;
      x = source.centreX - l / 2; y = source.y + source.hauteur - 2;
      break;
    case 'gauche':
      l = portee; h = epaisseur;
      x = source.x - portee + 2; y = source.centreY - h / 2;
      break;
    default: // droite
      l = portee; h = epaisseur;
      x = source.x + source.largeur - 2; y = source.centreY - h / 2;
      break;
  }

  const zone = new ZoneDegats({
    x, y, largeur: l, hauteur: h,
    equipe: source.equipe,
    proprietaire: source,
    ...options,
  });
  scene.ajouter(zone);
  return zone;
}

/** Explosion circulaire (bombe, boss). */
export function explosion(x, y, scene, options = {}) {
  const rayon = options.rayon ?? 26;
  const zone = new ZoneDegats({
    x: x - rayon, y: y - rayon, largeur: rayon * 2, hauteur: rayon * 2,
    degats: options.degats ?? 2,
    equipe: options.equipe || 'joueur',
    duree: 0.18,
    forceRecul: 220,
    casseTuiles: 'bombe',
  });
  scene.ajouter(zone);
  scene.particules.emettre(x, y, { nombre: 30, couleurs: ['#f2c14b', '#ef6c2e', '#e04a4a', '#ffffff'], vitesse: [60, 220], duree: [0.3, 0.7] });
  scene.camera.secouer(4, 0.35);
  scene.audio.jouer('bombe');
  return zone;
}
