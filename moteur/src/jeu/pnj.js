/* =========================================================================
   pnj.js — Les personnages gentils : villageois, sage, marchand...
   Ils utilisent les textes ecrits dans contenu/dialogues.js.
   ========================================================================= */

import { Entite } from './entite.js';
import { Animateur } from '../noyau/animation.js';
import { DIALOGUES } from '../contenu/dialogues.js';
import { deplacer } from './physique.js';
import { auHasard, hasard, VECTEURS, vecteurVersDirection } from '../noyau/maths.js';

export class PNJ extends Entite {
  constructor(options = {}) {
    super({
      largeur: 11, hauteur: 9, solide: true, equipe: 'neutre',
      sprite: options.sprite || 'villageois_0',
      decalageSpriteY: 2,
      ...options, type: 'pnj',
    });
    this.dialogue = options.dialogue || null;
    this.errant = options.errant ?? false;
    this.memoire = {};
    if (options.animations) {
      this.animateur = new Animateur(options.animations);
    }
  }

  maj(dt, scene) {
    if (this.animateur) this.animateur.maj(dt);
    if (!this.errant || this.enTrainDeParler) return;
    const m = this.memoire;
    m.minuteur = (m.minuteur ?? 0) - dt;
    if (m.minuteur <= 0) {
      m.direction = auHasard(['haut', 'bas', 'gauche', 'droite', null]);
      m.minuteur = hasard(1, 2.5);
    }
    if (m.direction) {
      const vecteur = VECTEURS[m.direction];
      this.direction = m.direction;
      deplacer(this, vecteur.x * 22 * dt, vecteur.y * 22 * dt, scene.carte, scene.entitesSolides);
    }
  }

  interagir(scene, joueur) {
    // Le PNJ se tourne vers le heros.
    this.direction = vecteurVersDirection(joueur.centreX - this.centreX, joueur.centreY - this.centreY);
    const fiche = DIALOGUES[this.dialogue];
    if (!fiche) {
      scene.dialogue.montrer(['...']);
      return;
    }

    const contexte = {
      scene, joueur, inventaire: scene.inventaire,
      drapeau: (nom) => scene.drapeauLeve(nom),
      leverDrapeau: (nom) => scene.leverDrapeau(nom),
    };

    // On cherche la premiere variante dont la condition est vraie.
    let choisie = { pages: fiche.pages, apres: fiche.apres };
    for (const variante of fiche.variantes || []) {
      if (!variante.si || variante.si(contexte)) {
        choisie = variante;
        break;
      }
    }

    const pages = typeof choisie.pages === 'function' ? choisie.pages(contexte) : choisie.pages;
    scene.dialogue.montrer(pages, {
      titre: fiche.titre || this.nom,
      portrait: fiche.portrait || this.sprite,
      surFin: () => {
        if (choisie.apres) choisie.apres(contexte);
        if (fiche.toujoursApres) fiche.toujoursApres(contexte);
      },
    });
  }
}
