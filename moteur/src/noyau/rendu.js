/* =========================================================================
   rendu.js — L'ecran, la camera et les outils pour dessiner.
   Le jeu dessine toujours dans une petite image (320 x 192 pixels), comme
   sur une vieille console. On l'agrandit ensuite pour remplir la fenetre :
   c'est ce qui donne le look "pixel art" bien net.
   ========================================================================= */

import { borner, melange, hasard } from './maths.js';

export class Ecran {
  /**
   * options.transparent : le canvas laisse voir ce qu'il y a derriere
   *                       (on s'en sert pour poser l'interface sur la 3D)
   * options.remplir     : il occupe toute la fenetre au lieu d'un
   *                       agrandissement par nombre entier
   */
  constructor(canvas, largeur = 320, hauteur = 192, options = {}) {
    this.canvas = canvas;
    this.largeur = largeur;
    this.hauteur = hauteur;
    this.transparent = !!options.transparent;
    this.remplir = !!options.remplir;
    canvas.width = largeur;
    canvas.height = hauteur;
    this.ctx = canvas.getContext('2d', { alpha: this.transparent });
    this.ctx.imageSmoothingEnabled = false; // pixels bien carres !
    this.echelle = 1;
    this.redimensionner();
    window.addEventListener('resize', () => this.redimensionner());
  }

  /** Agrandit le canvas par un nombre entier pour garder des pixels nets. */
  redimensionner() {
    if (this.remplir) {
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.ctx.imageSmoothingEnabled = false;
      return;
    }
    const parent = this.canvas.parentElement || document.body;
    const dispoL = parent.clientWidth || window.innerWidth;
    const dispoH = parent.clientHeight || window.innerHeight;
    const echelle = Math.max(1, Math.floor(Math.min(dispoL / this.largeur, dispoH / this.hauteur)));
    this.echelle = echelle;
    this.canvas.style.width = `${this.largeur * echelle}px`;
    this.canvas.style.height = `${this.hauteur * echelle}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  effacer(couleur = '#000000') {
    if (this.transparent) {
      // On efface vraiment : la 3D doit rester visible derriere.
      this.ctx.clearRect(0, 0, this.largeur, this.hauteur);
      return;
    }
    this.ctx.fillStyle = couleur;
    this.ctx.fillRect(0, 0, this.largeur, this.hauteur);
  }
}

export class Camera {
  constructor(largeur, hauteur) {
    this.x = 0;
    this.y = 0;
    this.largeur = largeur;
    this.hauteur = hauteur;
    this.secousseForce = 0;
    this.secousseRestant = 0;
    this.decalageX = 0;
    this.decalageY = 0;
  }

  /** Centre la camera sur une entite, sans sortir des limites de la carte. */
  suivre(cible, carte, immediat = false) {
    if (!cible) return;
    let viseX = cible.x + cible.largeur / 2 - this.largeur / 2;
    let viseY = cible.y + cible.hauteur / 2 - this.hauteur / 2;
    if (carte) {
      viseX = borner(viseX, 0, Math.max(0, carte.largeurPixels - this.largeur));
      viseY = borner(viseY, 0, Math.max(0, carte.hauteurPixels - this.hauteur));
    }
    if (immediat) {
      this.x = viseX;
      this.y = viseY;
    } else {
      this.x = melange(this.x, viseX, 0.2);
      this.y = melange(this.y, viseY, 0.2);
    }
  }

  /** Fait trembler l'ecran (coup d'epee du boss, explosion...). */
  secouer(force = 3, duree = 0.25) {
    this.secousseForce = Math.max(this.secousseForce, force);
    this.secousseRestant = Math.max(this.secousseRestant, duree);
  }

  maj(dt) {
    if (this.secousseRestant > 0) {
      this.secousseRestant -= dt;
      const force = this.secousseForce * (this.secousseRestant > 0 ? 1 : 0);
      this.decalageX = hasard(-force, force);
      this.decalageY = hasard(-force, force);
      if (this.secousseRestant <= 0) {
        this.secousseForce = 0;
        this.decalageX = 0;
        this.decalageY = 0;
      }
    }
  }

  /** Deplace le "crayon" pour dessiner le monde a la bonne place. */
  appliquer(ctx) {
    ctx.save();
    ctx.translate(
      -Math.round(this.x + this.decalageX),
      -Math.round(this.y + this.decalageY)
    );
  }

  restaurer(ctx) {
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* Petits outils de dessin, utilisables partout.                       */
/* ------------------------------------------------------------------ */

/** Ecrit du texte facon console retro. */
export function texte(ctx, message, x, y, options = {}) {
  const {
    taille = 8,
    couleur = '#ffffff',
    ombre = '#000000',
    alignement = 'left',
    police = 'monospace',
    gras = true,
  } = options;
  ctx.save();
  ctx.font = `${gras ? 'bold ' : ''}${taille}px ${police}`;
  ctx.textAlign = alignement;
  ctx.textBaseline = 'top';
  if (ombre) {
    ctx.fillStyle = ombre;
    ctx.fillText(message, Math.round(x) + 1, Math.round(y) + 1);
  }
  ctx.fillStyle = couleur;
  ctx.fillText(message, Math.round(x), Math.round(y));
  ctx.restore();
}

/** Rectangle plein. */
export function rect(ctx, x, y, l, h, couleur) {
  ctx.fillStyle = couleur;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(l), Math.round(h));
}

/** Contour de rectangle (1 pixel). */
export function cadre(ctx, x, y, l, h, couleur, epaisseur = 1) {
  ctx.fillStyle = couleur;
  x = Math.round(x);
  y = Math.round(y);
  l = Math.round(l);
  h = Math.round(h);
  ctx.fillRect(x, y, l, epaisseur);
  ctx.fillRect(x, y + h - epaisseur, l, epaisseur);
  ctx.fillRect(x, y, epaisseur, h);
  ctx.fillRect(x + l - epaisseur, y, epaisseur, h);
}

/** Boite de menu / dialogue avec bordure, comme dans les jeux retro. */
export function boite(ctx, x, y, l, h, options = {}) {
  const { fond = '#141021', bord = '#f4f1de', bord2 = '#5b5480' } = options;
  rect(ctx, x, y, l, h, fond);
  cadre(ctx, x, y, l, h, bord2);
  cadre(ctx, x + 1, y + 1, l - 2, h - 2, bord);
}

/** Cercle plein (utilise pour les particules et les ondes de choc). */
export function cercle(ctx, x, y, rayon, couleur) {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), rayon, 0, Math.PI * 2);
  ctx.fill();
}

/** Ombre ovale sous une entite : donne du relief pour trois fois rien. */
export function ombrePortee(ctx, x, y, l, opacite = 0.3) {
  ctx.save();
  ctx.globalAlpha = opacite;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), l / 2, l / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
