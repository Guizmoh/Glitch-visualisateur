/* =========================================================================
   fabrique.js — Transforme les LIGNES DE DONNEES des cartes en vraies
   entites du jeu. C'est ce qui rend l'ajout de contenu si rapide :

     entites: [
       { type:'ennemi', espece:'gluant', x:6, y:4 },
       { type:'coffre', contenu:'arc', x:10, y:2, drapeau:'coffre-arc' },
       { type:'pnj', dialogue:'sage', sprite:'sage_0', x:9, y:7 },
     ]

   x et y sont en CASES (pas en pixels) : plus simple a ecrire.
   Pour inventer un nouveau type, ajoute une entree dans FABRIQUES.
   ========================================================================= */

import { Ennemi } from './ennemi.js';
import { PNJ } from './pnj.js';
import { Coffre, Panneau, BlocPoussable, Passage } from './interactifs.js';
import { Ramassable } from './ramassable.js';
import { TAILLE_TUILE } from '../monde/tuileset.js';

/** Convertit une position en cases vers des pixels (centre de la case). */
function versPixels(valeur, tailleEntite, taille = TAILLE_TUILE) {
  return valeur * taille + (taille - tailleEntite) / 2;
}

export const FABRIQUES = {
  ennemi(d) {
    const ennemi = new Ennemi({ espece: d.espece || 'gluant', ...d, x: 0, y: 0 });
    ennemi.x = versPixels(d.x, ennemi.largeur);
    ennemi.y = versPixels(d.y, ennemi.hauteur);
    return ennemi;
  },

  coffre(d) {
    const coffre = new Coffre({ ...d, x: 0, y: 0 });
    coffre.x = versPixels(d.x, coffre.largeur);
    coffre.y = versPixels(d.y, coffre.hauteur);
    return coffre;
  },

  pnj(d) {
    const pnj = new PNJ({ ...d, x: 0, y: 0 });
    pnj.x = versPixels(d.x, pnj.largeur);
    pnj.y = versPixels(d.y, pnj.hauteur);
    return pnj;
  },

  bloc(d) {
    return new BlocPoussable({ ...d, x: d.x * TAILLE_TUILE, y: d.y * TAILLE_TUILE });
  },

  objet(d) {
    const objet = new Ramassable({ objet: d.objet || 'rubis', ...d, x: 0, y: 0, dureeVie: Infinity });
    objet.x = versPixels(d.x, objet.largeur);
    objet.y = versPixels(d.y, objet.hauteur);
    return objet;
  },

  panneau(d) {
    const panneau = new Panneau({ ...d, x: 0, y: 0 });
    panneau.x = versPixels(d.x, panneau.largeur);
    panneau.y = versPixels(d.y, panneau.hauteur);
    return panneau;
  },

  passage(d) {
    const passage = new Passage({ ...d, x: 0, y: 0 });
    passage.x = versPixels(d.x, passage.largeur);
    passage.y = versPixels(d.y, passage.hauteur);
    return passage;
  },
};

/** Cree une entite a partir d'une ligne de donnees. */
export function creerEntite(donnees) {
  const fabrique = FABRIQUES[donnees.type];
  if (!fabrique) {
    console.warn(`Type d'entite inconnu : "${donnees.type}"`);
    return null;
  }
  return fabrique(donnees);
}

/** Cree toutes les entites d'une salle. */
export function creerEntites(liste = []) {
  return liste.map((donnees) => creerEntite(donnees)).filter(Boolean);
}
