/* =========================================================================
   maths.js — La boîte à outils de calcul du moteur.
   Rien de compliqué ici : juste des petites fonctions utilisées partout.
   ========================================================================= */

/** Garde une valeur entre un minimum et un maximum. clamp(15, 0, 10) => 10 */
export function borner(valeur, min, max) {
  return valeur < min ? min : valeur > max ? max : valeur;
}

/** Mélange doux entre deux valeurs. t va de 0 (a) à 1 (b). */
export function melange(a, b, t) {
  return a + (b - a) * t;
}

/** Avance "depuis" vers "vers" d'au maximum "pas". Pratique pour les accélérations. */
export function approcher(depuis, vers, pas) {
  if (depuis < vers) return Math.min(depuis + pas, vers);
  if (depuis > vers) return Math.max(depuis - pas, vers);
  return vers;
}

/** Nombre décimal au hasard entre min et max. */
export function hasard(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}

/** Nombre entier au hasard entre min et max inclus. */
export function hasardEntier(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Choisit un element au hasard dans une liste. */
export function auHasard(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

/** Vrai avec une probabilite donnee (0 = jamais, 1 = toujours). */
export function chance(probabilite) {
  return Math.random() < probabilite;
}

/** Distance entre deux points. */
export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Angle (en radians) du point A vers le point B. */
export function angleVers(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/** Est-ce que les deux rectangles se touchent ? (rect = {x, y, l, h}) */
export function rectsSeTouchent(a, b) {
  return a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Est-ce que le point (px, py) est dans le rectangle ? */
export function pointDansRect(px, py, r) {
  return px >= r.x && px <= r.x + r.l && py >= r.y && py <= r.y + r.h;
}

/** Transforme un vecteur en direction cardinale : 'haut', 'bas', 'gauche' ou 'droite'. */
export function vecteurVersDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'droite' : 'gauche';
  return dy > 0 ? 'bas' : 'haut';
}

/** Transforme une direction cardinale en vecteur {x, y}. */
export const VECTEURS = {
  haut: { x: 0, y: -1 },
  bas: { x: 0, y: 1 },
  gauche: { x: -1, y: 0 },
  droite: { x: 1, y: 0 },
};

/** Normalise un vecteur (longueur 1) pour que la diagonale ne soit pas plus rapide. */
export function normaliser(x, y) {
  const longueur = Math.hypot(x, y);
  if (longueur === 0) return { x: 0, y: 0 };
  return { x: x / longueur, y: y / longueur };
}
