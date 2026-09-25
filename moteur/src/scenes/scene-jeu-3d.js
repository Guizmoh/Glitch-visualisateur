/* =========================================================================
   scene-jeu-3d.js — LA PARTIE, EN 3D.

   Cette scene ne rejoue pas les regles du jeu : elle herite de SceneJeu,
   donc tout (salles, ennemis, combat, coffres, dialogues, sauvegarde) reste
   exactement le meme. Seuls deux points changent :
     - on dessine le monde en volume au lieu de le dessiner a plat ;
     - le changement de salle se fait en fondu au noir, parce que le
       glissement d'ecran du jeu 2D n'a plus de sens en perspective.
   ========================================================================= */

import { SceneJeu } from './scene-jeu.js';
import { CONFIG } from '../contenu/config.js';

export class SceneJeu3D extends SceneJeu {
  entrer(donnees = {}) {
    super.entrer(donnees);
    this.vue = this.moteur.vue3d;
    if (this.vue) this.vue.construireSalle(this.carte);
  }

  /**
   * En 2D, sortir par un bord faisait glisser l'ecran. En 3D on fond au
   * noir : c'est plus lisible, et ca laisse le temps de rebatir la salle.
   */
  sortirParLeBord(direction) {
    const destination = this.carte.sorties[direction];
    if (!destination) return;
    this.joueur.bloqueEntrees = true;

    this.fondu.fermerPuis(() => {
      this.chargerSalle(destination);
      const marge = 4;
      if (direction === 'ouest') this.joueur.x = this.carte.largeurPixels - this.joueur.largeur - marge;
      if (direction === 'est') this.joueur.x = marge;
      if (direction === 'nord') this.joueur.y = this.carte.hauteurPixels - this.joueur.hauteur - marge;
      if (direction === 'sud') this.joueur.y = marge;
      this.joueur.dernierePositionSure = { x: this.joueur.x, y: this.joueur.y };
      this.camera.suivre(this.joueur, this.carte, true);
      this.joueur.bloqueEntrees = false;
      this.sauvegarder();
    }, 3.2);
  }

  dessiner(ctx) {
    // 1. Le monde, en 3D, derriere.
    if (this.vue) this.vue.majEtRendre(this, this.moteur.dt || 0.016);
    // 2. L'interface, a plat, par-dessus. C'est exactement celle du jeu 2D.
    this.dessinerInterface(ctx);
  }
}
