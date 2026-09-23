/* =========================================================================
   scene-pause.js — Le menu pause : inventaire et commandes.
   Elle se dessine PAR-DESSUS la partie (transparente = true).
   ========================================================================= */

import { Scene } from '../noyau/scene.js';
import { texte, boite, rect } from '../noyau/rendu.js';
import { OBJETS } from '../contenu/objets.js';

export class ScenePause extends Scene {
  constructor() {
    super('pause');
    this.transparente = true;
  }

  entrer() {
    this.jeu = this.moteur.scenes[this.moteur.scenes.length - 2];
  }

  maj(dt) {
    if (this.entrees.pressee('pause') || this.entrees.pressee('annuler')) {
      this.moteur.audio.jouer('menu');
      this.moteur.depiler();
      return;
    }
    if (this.entrees.pressee('objet')) {
      const suivant = this.jeu.inventaire.equiperSuivant();
      if (suivant) this.moteur.audio.jouer('menu');
    }
  }

  dessiner(ctx) {
    const L = this.ecran.largeur;
    const H = this.ecran.hauteur;
    ctx.save();
    ctx.globalAlpha = 0.72;
    rect(ctx, 0, 0, L, H, '#0b0a12');
    ctx.restore();

    boite(ctx, 16, 14, L - 32, H - 28, { fond: '#1b1730' });
    texte(ctx, 'PAUSE', L / 2, 22, { taille: 10, alignement: 'center', couleur: '#f2c14b' });

    const inventaire = this.jeu.inventaire;
    const atlas = this.moteur.atlas;

    // Ligne des consommables
    let x = 30;
    const y = 42;
    const compteurs = [
      ['rubis', inventaire.rubis],
      ['cle', inventaire.cles],
      ['bombe', inventaire.bombes],
      ['fleche', inventaire.fleches],
    ];
    for (const [sprite, valeur] of compteurs) {
      const image = atlas.image(sprite);
      if (image) ctx.drawImage(image, x, y);
      texte(ctx, `x${valeur}`, x + 10, y + 1, { taille: 7, couleur: '#f4f1de' });
      x += 40;
    }

    // Les objets trouves
    texte(ctx, 'OBJETS', 30, 62, { taille: 8, couleur: '#a8aec0' });
    let ox = 30;
    const oy = 74;
    for (const nom of inventaire.objets) {
      const def = OBJETS[nom];
      if (!def) continue;
      const equipe = inventaire.equipe === nom;
      boite(ctx, ox, oy, 22, 22, { fond: equipe ? '#3a2f5e' : '#241d3a' });
      const image = atlas.image(def.sprite);
      if (image) ctx.drawImage(image, ox + 11 - image.width / 2, oy + 11 - image.height / 2);
      if (def.compteur) {
        texte(ctx, `${inventaire.compteur(nom)}`, ox + 18, oy + 14, { taille: 7, alignement: 'right' });
      }
      ox += 26;
      if (ox > L - 50) {
        ox = 30;
      }
    }

    // Aide
    const lignes = [
      'Fleches / ZQSD : marcher',
      'ESPACE : epee, parler, ouvrir',
      'C : objet equipe   (P : pause)',
      'Ici : C change d\'objet equipe',
    ];
    let ay = H - 58;
    for (const ligne of lignes) {
      texte(ctx, ligne, L / 2, ay, { taille: 7, alignement: 'center', couleur: '#8f88a8' });
      ay += 9;
    }
  }
}
