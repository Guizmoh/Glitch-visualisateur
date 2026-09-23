/* =========================================================================
   scene-fin.js — Game over ou victoire.
   ========================================================================= */

import { Scene } from '../noyau/scene.js';
import { texte, rect } from '../noyau/rendu.js';
import { MUSIQUES } from '../contenu/musiques.js';

export class SceneFin extends Scene {
  constructor(options = {}) {
    super('fin');
    this.victoire = options.victoire || false;
    this.temps = 0;
  }

  entrer() {
    const musique = this.victoire ? MUSIQUES.victoire : MUSIQUES.defaite;
    if (musique) this.moteur.audio.jouerMusique(musique.notes, musique.options);
  }

  sortir() {
    this.moteur.audio.arreterMusique();
  }

  maj(dt) {
    this.temps += dt;
    if (this.temps > 1.2 && (this.entrees.pressee('attaque') || this.entrees.pressee('objet'))) {
      import('./scene-titre.js').then(({ SceneTitre }) => {
        this.moteur.changerScene(new SceneTitre());
      });
    }
  }

  dessiner(ctx) {
    const L = this.ecran.largeur;
    const H = this.ecran.hauteur;
    rect(ctx, 0, 0, L, H, this.victoire ? '#15234a' : '#1a0d14');

    const titre = this.victoire ? 'BRAVO !' : 'GAME OVER';
    const couleur = this.victoire ? '#f2c14b' : '#e04a4a';
    texte(ctx, titre, L / 2, H / 2 - 20, { taille: 18, alignement: 'center', couleur });

    const message = this.victoire
      ? 'Le village est sauve. Tu es un vrai heros !'
      : 'Le heros est tombe... Mais il peut recommencer.';
    texte(ctx, message, L / 2, H / 2 + 8, { taille: 8, alignement: 'center', couleur: '#f4f1de' });

    if (this.temps > 1.2 && Math.floor(this.temps * 2) % 2 === 0) {
      texte(ctx, 'ESPACE pour revenir au titre', L / 2, H - 28, {
        taille: 7, alignement: 'center', couleur: '#7ee0e8',
      });
    }
  }
}
