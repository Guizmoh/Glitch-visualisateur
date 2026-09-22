/* =========================================================================
   carte.js — Une SALLE du jeu (un ecran, comme dans les vieux Zelda).
   Le decor s'ecrit avec des lettres, c'est super rapide a modifier :

     decor: [
       '####################',
       '#..................#',
       '#....TT.....%%.....#',
       ...
     ]
   ========================================================================= */

import { TAILLE_TUILE, construireTuileset, definitionTuile, imageTuile, motifDessus } from './tuileset.js';
import { creerCanvas } from '../noyau/pixels.js';

export { TAILLE_TUILE };

export class Carte {
  constructor(donnees) {
    construireTuileset();
    this.donnees = donnees;
    this.nom = donnees.nom || 'salle';
    this.titre = donnees.titre || '';
    this.grille = donnees.decor.map((ligne) => ligne.split(''));
    this.hauteur = this.grille.length;
    this.largeur = this.grille.reduce((max, l) => Math.max(max, l.length), 0);
    // On complete les lignes trop courtes pour eviter les trous.
    for (const ligne of this.grille) {
      while (ligne.length < this.largeur) ligne.push('.');
    }
    this.sorties = donnees.sorties || {}; // { nord:'salle-2', sud:..., est:..., ouest:... }
    this.entites = donnees.entites || [];
    this.fond = donnees.fond || '#0b0a12';
    this.musique = donnees.musique || null;
    this._canvasSol = null;
    this._canvasDessus = null;
    this._aRedessiner = true;
  }

  get largeurPixels() {
    return this.largeur * TAILLE_TUILE;
  }

  get hauteurPixels() {
    return this.hauteur * TAILLE_TUILE;
  }

  /* ---- Lecture de la grille -------------------------------------- */

  dansLaCarte(col, ligne) {
    return col >= 0 && ligne >= 0 && col < this.largeur && ligne < this.hauteur;
  }

  symbole(col, ligne) {
    if (!this.dansLaCarte(col, ligne)) return null;
    return this.grille[ligne][col];
  }

  tuile(col, ligne) {
    const symbole = this.symbole(col, ligne);
    return symbole === null ? null : definitionTuile(symbole);
  }

  /** Tuile a une position en pixels. */
  tuileEnPixels(x, y) {
    return this.tuile(Math.floor(x / TAILLE_TUILE), Math.floor(y / TAILLE_TUILE));
  }

  colonneDe(x) {
    return Math.floor(x / TAILLE_TUILE);
  }

  ligneDe(y) {
    return Math.floor(y / TAILLE_TUILE);
  }

  /**
   * Peut-on traverser cette case ?
   * capacites : { nage:false, vole:false } pour les objets/ennemis speciaux.
   */
  estSolide(col, ligne, capacites = {}) {
    if (!this.dansLaCarte(col, ligne)) return true; // les bords bloquent
    const tuile = this.tuile(col, ligne);
    if (!tuile) return true;
    if (capacites.vole) return false; // les volants passent partout
    if (tuile.eau && capacites.nage) return false;
    if (tuile.trou && capacites.vole) return false;
    return !!tuile.solide;
  }

  /** Change une case (porte qui s'ouvre, buisson coupe...). */
  remplacer(col, ligne, symbole) {
    if (!this.dansLaCarte(col, ligne)) return;
    this.grille[ligne][col] = symbole;
    this._aRedessiner = true;
  }

  /** Trouve toutes les cases qui portent une lettre donnee. */
  trouver(symbole) {
    const trouvees = [];
    for (let ligne = 0; ligne < this.hauteur; ligne++) {
      for (let col = 0; col < this.largeur; col++) {
        if (this.grille[ligne][col] === symbole) trouvees.push({ col, ligne });
      }
    }
    return trouvees;
  }

  /**
   * Essaie de casser une tuile (buisson a l'epee, rocher a la bombe...).
   * Retourne les infos de la casse, ou null si rien ne se passe.
   */
  casser(col, ligne, par = 'epee') {
    const tuile = this.tuile(col, ligne);
    if (!tuile || !tuile.casse) return null;
    if (tuile.casse.par !== par) return null;
    this.remplacer(col, ligne, tuile.casse.devient);
    return {
      ...tuile.casse,
      x: col * TAILLE_TUILE + TAILLE_TUILE / 2,
      y: ligne * TAILLE_TUILE + TAILLE_TUILE / 2,
    };
  }

  /* ---- Dessin ------------------------------------------------------ */

  /** Re-dessine la carte dans une image memoire (beaucoup plus rapide). */
  _rendre() {
    const sol = creerCanvas(this.largeurPixels, this.hauteurPixels);
    const dessus = creerCanvas(this.largeurPixels, this.hauteurPixels);
    for (let ligne = 0; ligne < this.hauteur; ligne++) {
      for (let col = 0; col < this.largeur; col++) {
        const symbole = this.grille[ligne][col];
        const image = imageTuile(symbole, col, ligne);
        const x = col * TAILLE_TUILE;
        const y = ligne * TAILLE_TUILE;
        if (image) sol.ctx.drawImage(image, x, y);
        const haut = motifDessus(symbole);
        if (haut) dessus.ctx.drawImage(haut, x, y);
      }
    }
    this._canvasSol = sol.canvas;
    this._canvasDessus = dessus.canvas;
    this._aRedessiner = false;
  }

  dessinerSol(ctx) {
    if (this._aRedessiner) this._rendre();
    ctx.drawImage(this._canvasSol, 0, 0);
  }

  dessinerDessus(ctx) {
    if (this._aRedessiner) this._rendre();
    ctx.drawImage(this._canvasDessus, 0, 0);
  }

  /** Copie du decor sous forme de texte (utile pour l'editeur). */
  versTexte() {
    return this.grille.map((ligne) => ligne.join(''));
  }
}
