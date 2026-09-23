/* =========================================================================
   hud.js — Les informations affichees en permanence :
   les coeurs, les rubis, les cles, les bombes, l'objet equipe.
   ========================================================================= */

import { texte, rect, boite } from '../noyau/rendu.js';
import { OBJETS } from '../contenu/objets.js';

export class HUD {
  constructor(largeurEcran) {
    this.largeurEcran = largeurEcran;
    this.titreSalle = '';
    this.tempsTitre = 0;
  }

  /** Affiche le nom de la salle pendant quelques secondes. */
  annoncerSalle(nom) {
    if (!nom) return;
    this.titreSalle = nom;
    this.tempsTitre = 2.2;
  }

  maj(dt) {
    if (this.tempsTitre > 0) this.tempsTitre -= dt;
  }

  dessiner(ctx, scene) {
    const joueur = scene.joueur;
    const inventaire = scene.inventaire;
    const atlas = scene.atlas;
    if (!joueur) return;

    // --- Bandeau sombre en haut
    ctx.save();
    ctx.globalAlpha = 0.55;
    rect(ctx, 0, 0, this.largeurEcran, 13, '#0b0a12');
    ctx.restore();

    // --- Les coeurs
    const coeur = atlas.image('coeur');
    const coeurVide = atlas.silhouette('coeur', '#4a4458');
    const nbCoeurs = Math.ceil(joueur.pvMax / 2);
    for (let i = 0; i < nbCoeurs; i++) {
      const x = 3 + i * 9;
      const y = 3;
      const valeur = joueur.pv - i * 2; // 2 = plein, 1 = moitie, <=0 = vide
      if (coeurVide) ctx.drawImage(coeurVide, x, y);
      if (valeur >= 2) {
        ctx.drawImage(coeur, x, y);
      } else if (valeur === 1) {
        ctx.drawImage(coeur, 0, 0, 4, 8, x, y, 4, 8); // moitie gauche
      }
    }

    // --- Rubis / cles / bombes a droite
    let x = this.largeurEcran - 4;
    x = this._compteur(ctx, atlas, x, 'rubis', inventaire.rubis);
    if (inventaire.cles > 0) x = this._compteur(ctx, atlas, x, 'cle', inventaire.cles);
    if (inventaire.possede('bombes')) x = this._compteur(ctx, atlas, x, 'bombe', inventaire.bombes);

    // --- Objet equipe (case en haut a droite sous le bandeau)
    if (inventaire.equipe) {
      const def = OBJETS[inventaire.equipe];
      const cx = this.largeurEcran - 22;
      const cy = 15;
      boite(ctx, cx, cy, 20, 20, { fond: '#1b1730' });
      const image = atlas.image(def?.sprite);
      if (image) ctx.drawImage(image, cx + 10 - image.width / 2, cy + 10 - image.height / 2);
      const munitions = inventaire.munitionsEquipe();
      if (munitions !== null) {
        texte(ctx, String(munitions), cx + 17, cy + 13, { taille: 7, alignement: 'right', couleur: '#f4f1de' });
      }
    }

    // --- Nom de la salle qui s'efface tout seul
    if (this.tempsTitre > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.tempsTitre);
      texte(ctx, this.titreSalle, this.largeurEcran / 2, 16, {
        taille: 8, alignement: 'center', couleur: '#f4f1de',
      });
      ctx.restore();
    }
  }

  _compteur(ctx, atlas, x, sprite, valeur) {
    const chiffres = String(valeur).padStart(2, '0');
    texte(ctx, chiffres, x, 3, { taille: 8, alignement: 'right', couleur: '#f4f1de' });
    const largeurTexte = chiffres.length * 5 + 2;
    const image = atlas.image(sprite);
    if (image) ctx.drawImage(image, x - largeurTexte - 8, 2);
    return x - largeurTexte - 11;
  }
}
