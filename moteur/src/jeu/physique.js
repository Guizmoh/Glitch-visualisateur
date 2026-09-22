/* =========================================================================
   physique.js — Empeche de traverser les murs.
   On deplace d'abord en X, on corrige, puis en Y : c'est la methode la plus
   simple et la plus fiable pour un jeu en vue de dessus.
   ========================================================================= */

import { TAILLE_TUILE } from '../monde/tuileset.js';

/**
 * Deplace une entite de (dx, dy) en tenant compte du decor et des entites
 * solides. Retourne ce qui a bloque : { murX, murY, tuiles:[...] }
 */
export function deplacer(entite, dx, dy, carte, entitesSolides = []) {
  const resultat = { murX: false, murY: false, bloquePar: null };
  if (entite.traverseMurs) {
    entite.x += dx;
    entite.y += dy;
    return resultat;
  }

  // Securite : si l'entite est DEJA dans un mur (mal placee dans la carte),
  // on la laisse bouger librement pour qu'elle puisse en sortir.
  // Sans ca, un heros pose sur un arbre resterait coince pour toujours !
  if (collisionDecor(entite, carte)) {
    entite.x += dx;
    entite.y += dy;
    resultat.coince = true;
    return resultat;
  }

  // --- Axe X ---
  if (dx !== 0) {
    entite.x += dx;
    if (collisionDecor(entite, carte)) {
      entite.x -= dx;
      // On essaie de "glisser" le long du mur par petits pas.
      const pas = Math.sign(dx);
      let bouge = 0;
      while (Math.abs(bouge) < Math.abs(dx)) {
        entite.x += pas * 0.5;
        if (collisionDecor(entite, carte)) {
          entite.x -= pas * 0.5;
          break;
        }
        bouge += pas * 0.5;
      }
      resultat.murX = true;
    }
    const bloqueur = collisionEntites(entite, entitesSolides);
    if (bloqueur) {
      entite.x -= dx;
      resultat.murX = true;
      resultat.bloquePar = bloqueur;
    }
  }

  // --- Axe Y ---
  if (dy !== 0) {
    entite.y += dy;
    if (collisionDecor(entite, carte)) {
      entite.y -= dy;
      const pas = Math.sign(dy);
      let bouge = 0;
      while (Math.abs(bouge) < Math.abs(dy)) {
        entite.y += pas * 0.5;
        if (collisionDecor(entite, carte)) {
          entite.y -= pas * 0.5;
          break;
        }
        bouge += pas * 0.5;
      }
      resultat.murY = true;
    }
    const bloqueur = collisionEntites(entite, entitesSolides);
    if (bloqueur) {
      entite.y -= dy;
      resultat.murY = true;
      resultat.bloquePar = bloqueur;
    }
  }

  return resultat;
}

/** L'entite touche-t-elle un mur (ou de l'eau, un trou...) ? */
export function collisionDecor(entite, carte) {
  if (!carte) return false;
  const gauche = Math.floor(entite.x / TAILLE_TUILE);
  const droite = Math.floor((entite.x + entite.largeur - 0.01) / TAILLE_TUILE);
  const haut = Math.floor(entite.y / TAILLE_TUILE);
  const bas = Math.floor((entite.y + entite.hauteur - 0.01) / TAILLE_TUILE);
  for (let ligne = haut; ligne <= bas; ligne++) {
    for (let col = gauche; col <= droite; col++) {
      if (carte.estSolide(col, ligne, entite.capacites)) return true;
    }
  }
  return false;
}

/** L'entite touche-t-elle une autre entite solide ? */
export function collisionEntites(entite, entites) {
  for (const autre of entites) {
    if (autre === entite || !autre.vivante || !autre.solide) continue;
    if (entite.touche(autre)) return autre;
  }
  return null;
}

/** Liste des cases de decor sous une entite (pour les pics, l'eau, les trous). */
export function tuilesSous(entite, carte) {
  const cases = [];
  const gauche = Math.floor(entite.x / TAILLE_TUILE);
  const droite = Math.floor((entite.x + entite.largeur - 0.01) / TAILLE_TUILE);
  const haut = Math.floor(entite.y / TAILLE_TUILE);
  const bas = Math.floor((entite.y + entite.hauteur - 0.01) / TAILLE_TUILE);
  for (let ligne = haut; ligne <= bas; ligne++) {
    for (let col = gauche; col <= droite; col++) {
      const tuile = carte.tuile(col, ligne);
      if (tuile) cases.push({ col, ligne, tuile });
    }
  }
  return cases;
}

/** La case juste devant l'entite (pour parler, ouvrir, couper un buisson). */
export function caseDevant(entite, distance = 8) {
  const vecteurs = {
    haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0],
  };
  const [dx, dy] = vecteurs[entite.direction] || [0, 1];
  return {
    x: entite.centreX + dx * distance,
    y: entite.centreY + dy * distance,
    col: Math.floor((entite.centreX + dx * distance) / TAILLE_TUILE),
    ligne: Math.floor((entite.centreY + dy * distance) / TAILLE_TUILE),
  };
}
