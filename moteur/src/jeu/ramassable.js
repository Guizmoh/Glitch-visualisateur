/* =========================================================================
   ramassable.js — Les objets qui trainent par terre et qu'on attrape.
   ========================================================================= */

import { Entite } from './entite.js';
import { OBJETS, BUTIN_PAR_DEFAUT } from '../contenu/objets.js';
import { chance, auHasard } from '../noyau/maths.js';

export class Ramassable extends Entite {
  constructor(options = {}) {
    const def = OBJETS[options.objet] || {};
    super({
      largeur: 8, hauteur: 8, ombre: false, ...options,
      type: 'ramassable',
      sprite: def.sprite || 'rubis',
      equipe: 'neutre',
    });
    this.objet = options.objet;
    this.def = def;
    this.echelleSprite = def.echelle || 1;
    this.dureeVie = options.dureeVie ?? (def.permanent ? Infinity : 9);
    this.tempsVol = 0; // petit saut a l'apparition
    this.vitesseSaut = options.saut ? -60 : 0;
    this.hauteurVol = 0;
    this.delaiRamassage = 0.25; // pour ne pas le reprendre pendant le saut
    this.teinte = def.teinte || null;
  }

  maj(dt, scene) {
    this.delaiRamassage -= dt;
    this.dureeVie -= dt;
    if (this.dureeVie <= 0) {
      this.detruire();
      return;
    }
    // Clignote avant de disparaitre.
    if (this.dureeVie < 2.5) {
      this.opacite = Math.floor(this.dureeVie * 8) % 2 === 0 ? 0.3 : 1;
    }
    // Petit saut a l'apparition.
    if (this.vitesseSaut !== 0 || this.hauteurVol < 0) {
      this.hauteurVol += this.vitesseSaut * dt;
      this.vitesseSaut += 300 * dt;
      if (this.hauteurVol >= 0) {
        this.hauteurVol = 0;
        this.vitesseSaut = 0;
      }
    }
    // Flottement doux.
    this.decalageSpriteY = Math.round(this.hauteurVol + Math.sin(scene.temps * 4 + this.id) * 1);

    const joueur = scene.joueur;
    if (!joueur || !joueur.enVie || this.delaiRamassage > 0) return;

    // Aimante vers le heros quand il est proche.
    const distance = this.distanceVers(joueur);
    if (distance < 24) {
      const dx = joueur.centreX - this.centreX;
      const dy = joueur.centreY - this.centreY;
      const longueur = Math.hypot(dx, dy) || 1;
      this.x += (dx / longueur) * 90 * dt;
      this.y += (dy / longueur) * 90 * dt;
    }
    if (this.touche(joueur, 2)) this.ramasser(scene);
  }

  ramasser(scene) {
    const def = this.def;
    if (def.ramasser) {
      def.ramasser({ joueur: scene.joueur, inventaire: scene.inventaire, scene });
    }
    if (def.permanent) {
      scene.inventaire.donner(this.objet);
      if (def.message) scene.montrerObjetTrouve(this.objet, def.message);
    }
    scene.audio.jouer(def.son || 'rubis');
    scene.particules.emettre(this.centreX, this.centreY, {
      nombre: 6, couleurs: ['#ffffff', '#f2c14b'], vitesse: [20, 60], duree: [0.2, 0.4],
    });
    this.detruire();
  }

  dessiner(ctx, scene) {
    const nomImage = this.sprite;
    const image = this.teinte
      ? scene.atlas.silhouette(nomImage, this.teinte)
      : scene.atlas.image(nomImage);
    if (!image) return;
    const l = image.width * this.echelleSprite;
    const h = image.height * this.echelleSprite;
    ctx.save();
    ctx.globalAlpha = this.opacite;
    ctx.drawImage(
      image,
      Math.round(this.centreX - l / 2),
      Math.round(this.centreY - h / 2 + this.decalageSpriteY),
      l, h
    );
    ctx.restore();
  }
}

/**
 * Fait tomber un butin a un endroit.
 * butin : liste [{objet:'coeur', chance:0.3, quantite:1}] ou null pour le defaut.
 */
export function lacherButin(x, y, scene, butin = null) {
  const liste = butin || BUTIN_PAR_DEFAUT;
  for (const entree of liste) {
    if (!chance(entree.chance ?? 1)) continue;
    const quantite = entree.quantite ?? 1;
    for (let i = 0; i < quantite; i++) {
      scene.ajouter(new Ramassable({
        objet: entree.objet,
        x: x - 4 + (i * 6) - (quantite - 1) * 3,
        y: y - 4,
        saut: true,
      }));
    }
    if (entree.exclusif) break; // un seul objet de la liste
  }
}

/** Butin aleatoire simple : utilise quand on coupe un buisson ou casse un pot. */
export function butinRapide(x, y, scene, probabilite = 0.5) {
  if (!chance(probabilite)) return;
  const objet = auHasard(['coeur', 'rubis', 'rubis', 'munition_bombe']);
  scene.ajouter(new Ramassable({ objet, x: x - 4, y: y - 4, saut: true }));
}
