/* =========================================================================
   dialogue.js — La boite de texte en bas de l'ecran.
   Le texte s'ecrit lettre par lettre ; ESPACE passe a la suite.
   ========================================================================= */

import { boite, texte } from '../noyau/rendu.js';
import { CONFIG } from '../contenu/config.js';

export class BoiteDialogue {
  constructor(largeurEcran, hauteurEcran) {
    this.largeurEcran = largeurEcran;
    this.hauteurEcran = hauteurEcran;
    this.pages = [];
    this.pageActuelle = 0;
    this.lettresAffichees = 0;
    this.active = false;
    this.titre = '';
    this.portrait = null;
    this.surFin = null;
    this.lignesCache = new Map();
    this.hauteurBoite = 54;
  }

  /** Affiche une suite de pages de texte. */
  montrer(pages, options = {}) {
    this.pages = (Array.isArray(pages) ? pages : [pages]).filter(Boolean);
    if (this.pages.length === 0) return;
    this.pageActuelle = 0;
    this.lettresAffichees = 0;
    this.active = true;
    this.titre = options.titre || '';
    this.portrait = options.portrait || null;
    this.surFin = options.surFin || null;
  }

  fermer() {
    this.active = false;
    this.pages = [];
    const fin = this.surFin;
    this.surFin = null;
    if (fin) fin();
  }

  get texteComplet() {
    return this.lettresAffichees >= (this.pages[this.pageActuelle] || '').length;
  }

  maj(dt, entrees, audio) {
    if (!this.active) return;
    const page = this.pages[this.pageActuelle] || '';

    if (!this.texteComplet) {
      this.lettresAffichees += CONFIG.vitesseTexte * dt;
      if (this.lettresAffichees > page.length) this.lettresAffichees = page.length;
    }

    if (entrees.pressee('attaque') || entrees.pressee('objet')) {
      if (!this.texteComplet) {
        this.lettresAffichees = page.length; // tout afficher d'un coup
      } else if (this.pageActuelle < this.pages.length - 1) {
        this.pageActuelle++;
        this.lettresAffichees = 0;
        if (audio) audio.jouer('menu');
      } else {
        if (audio) audio.jouer('menu');
        this.fermer();
      }
    }
  }

  /** Coupe un texte en lignes qui tiennent dans la boite. */
  _lignes(ctx, message, largeurMax) {
    if (this.lignesCache.has(message)) return this.lignesCache.get(message);
    ctx.font = 'bold 8px monospace';
    const mots = message.split(' ');
    const lignes = [];
    let ligne = '';
    for (const mot of mots) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (ctx.measureText(essai).width > largeurMax && ligne) {
        lignes.push(ligne);
        ligne = mot;
      } else {
        ligne = essai;
      }
    }
    if (ligne) lignes.push(ligne);
    this.lignesCache.set(message, lignes);
    return lignes;
  }

  dessiner(ctx, atlas = null) {
    if (!this.active) return;
    const marge = 6;
    const l = this.largeurEcran - marge * 2;
    const h = this.hauteurBoite;
    const x = marge;
    const y = this.hauteurEcran - h - marge;

    boite(ctx, x, y, l, h);

    let texteX = x + 8;

    // Portrait du personnage a gauche
    if (this.portrait && atlas) {
      const image = atlas.image(this.portrait);
      if (image) {
        ctx.fillStyle = '#2a2440';
        ctx.fillRect(x + 5, y + 6, 20, 20);
        ctx.drawImage(image, x + 7, y + 8);
        texteX = x + 30;
      }
    }

    if (this.titre) {
      texte(ctx, this.titre, texteX, y + 5, { taille: 8, couleur: '#f2c14b' });
    }

    const page = this.pages[this.pageActuelle] || '';
    const visible = page.slice(0, Math.floor(this.lettresAffichees));
    const lignes = this._lignes(ctx, page, x + l - 8 - texteX);
    let compteur = 0;
    let decalageY = y + (this.titre ? 17 : 8);
    for (const ligne of lignes) {
      const debut = compteur;
      const fin = compteur + ligne.length;
      if (debut < visible.length) {
        const morceau = ligne.slice(0, Math.max(0, visible.length - debut));
        texte(ctx, morceau, texteX, decalageY, { taille: 8, couleur: '#f4f1de' });
      }
      compteur = fin + 1; // +1 pour l'espace supprime par le decoupage
      decalageY += 10;
    }

    // Petite fleche clignotante quand la page est finie
    if (this.texteComplet && Math.floor(Date.now() / 300) % 2 === 0) {
      texte(ctx, '▼', x + l - 12, y + h - 12, { taille: 8, couleur: '#f2c14b' });
    }
  }
}
