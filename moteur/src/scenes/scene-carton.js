/* =========================================================================
   scene-carton.js — LE CARTON : un texte sur fond noir, avant le jeu.
   C'est ce qui pose l'histoire en quelques secondes, sans rien expliquer
   de trop. Les textes sont dans contenu/histoire.js.
   ========================================================================= */

import { Scene } from '../noyau/scene.js';
import { texte, rect } from '../noyau/rendu.js';
import { CARTON_INTRO } from '../contenu/histoire.js';

const VITESSE_LETTRES = 26; // lettres par seconde
const PAUSE_ENTRE_LIGNES = 0.55;

export class SceneCarton extends Scene {
  /**
   * @param {object} options
   *   lignes   : les lignes a afficher
   *   suivante : une fonction qui renvoie la scene a jouer apres
   */
  constructor(options = {}) {
    super('carton');
    this.lignes = options.lignes || CARTON_INTRO;
    this.suivante = options.suivante || null;
  }

  entrer() {
    this.ligneActuelle = 0;
    this.lettres = 0;
    this.attente = 0;
    this.temps = 0;
    this.termine = false;
  }

  get toutAffiche() {
    return this.ligneActuelle >= this.lignes.length;
  }

  /** Affiche tout d'un coup (quand le joueur s'impatiente). */
  toutMontrer() {
    this.ligneActuelle = this.lignes.length;
    this.lettres = 0;
    this.attente = 0;
  }

  maj(dt) {
    this.temps += dt;

    if (!this.toutAffiche) {
      if (this.attente > 0) {
        this.attente -= dt;
      } else {
        const ligne = this.lignes[this.ligneActuelle];
        this.lettres += VITESSE_LETTRES * dt;
        if (this.lettres >= ligne.length) {
          this.ligneActuelle++;
          this.lettres = 0;
          // Une ligne vide sert de respiration : on marque une pause.
          this.attente = ligne === '' ? PAUSE_ENTRE_LIGNES * 0.6 : PAUSE_ENTRE_LIGNES;
        }
      }
    }

    if (this.entrees.pressee('attaque') || this.entrees.pressee('objet')) {
      if (!this.toutAffiche) {
        this.toutMontrer();
      } else {
        this.commencer();
      }
    }
  }

  commencer() {
    if (this.termine) return;
    this.termine = true;
    this.moteur.audio.jouer('menu');
    if (this.suivante) {
      this.moteur.changerScene(this.suivante());
    } else if (this.moteur.lancerPartie) {
      this.moteur.lancerPartie({});
    } else {
      import('./scene-jeu.js').then(({ SceneJeu }) => {
        this.moteur.changerScene(new SceneJeu());
      });
    }
  }

  dessiner(ctx) {
    const L = this.ecran.largeur;
    const H = this.ecran.hauteur;
    rect(ctx, 0, 0, L, H, '#07060a');

    // Le bloc de texte est centre verticalement.
    const hauteurLigne = 12;
    const total = this.lignes.length * hauteurLigne;
    let y = Math.round((H - total) / 2);

    for (let i = 0; i < this.lignes.length; i++) {
      const ligne = this.lignes[i];
      let visible = '';
      if (i < this.ligneActuelle) visible = ligne;
      else if (i === this.ligneActuelle) visible = ligne.slice(0, Math.floor(this.lettres));

      if (visible) {
        texte(ctx, visible, L / 2, y, {
          taille: 8, alignement: 'center', couleur: '#e8e2d2', ombre: '#000000',
        });
      }
      y += hauteurLigne;
    }

    if (this.toutAffiche && Math.floor(this.temps * 1.6) % 2 === 0) {
      texte(ctx, 'ESPACE', L / 2, H - 20, {
        taille: 7, alignement: 'center', couleur: '#6f6a85',
      });
    }
  }
}
