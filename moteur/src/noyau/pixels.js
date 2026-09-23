/* =========================================================================
   pixels.js — Transforme des DESSINS EN TEXTE en vraies images.
   Un sprite s'ecrit comme ca (chaque lettre = une couleur de la palette,
   le point "." = transparent) :

       const COEUR = [
         '.88.88.',
         '8888888',
         '.88888.',
         '..888..',
         '...8...',
       ];

   Aucune image a telecharger : le jeu fabrique ses graphismes au demarrage.
   ========================================================================= */

/** Cree un petit canvas hors ecran. */
export function creerCanvas(largeur, hauteur) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, largeur);
  canvas.height = Math.max(1, hauteur);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/** Taille d'un motif texte : {largeur, hauteur} en pixels. */
export function mesurerMotif(motif) {
  return {
    largeur: motif.reduce((max, ligne) => Math.max(max, ligne.length), 0),
    hauteur: motif.length,
  };
}

/** Dessine un motif texte dans un contexte, a la position voulue. */
export function dessinerMotif(ctx, motif, palette, x = 0, y = 0, taillePixel = 1) {
  for (let ligne = 0; ligne < motif.length; ligne++) {
    const texte = motif[ligne];
    for (let colonne = 0; colonne < texte.length; colonne++) {
      const lettre = texte[colonne];
      if (lettre === '.' || lettre === ' ') continue;
      const couleur = palette[lettre];
      if (!couleur) continue;
      ctx.fillStyle = couleur;
      ctx.fillRect(x + colonne * taillePixel, y + ligne * taillePixel, taillePixel, taillePixel);
    }
  }
}

/** Fabrique une image (canvas) a partir d'un motif texte. */
export function motifVersImage(motif, palette, { retourner = false, teinte = null } = {}) {
  const { largeur, hauteur } = mesurerMotif(motif);
  const { canvas, ctx } = creerCanvas(largeur, hauteur);
  dessinerMotif(ctx, motif, palette);
  let resultat = canvas;
  if (retourner) {
    const miroir = creerCanvas(largeur, hauteur);
    miroir.ctx.translate(largeur, 0);
    miroir.ctx.scale(-1, 1);
    miroir.ctx.drawImage(canvas, 0, 0);
    resultat = miroir.canvas;
  }
  if (teinte) {
    const colore = creerCanvas(largeur, hauteur);
    colore.ctx.drawImage(resultat, 0, 0);
    colore.ctx.globalCompositeOperation = 'source-atop';
    colore.ctx.fillStyle = teinte;
    colore.ctx.fillRect(0, 0, largeur, hauteur);
    resultat = colore.canvas;
  }
  return resultat;
}

/**
 * L'Atlas range toutes les images du jeu par nom.
 * atlas.image('heros_bas_0') -> un canvas pret a dessiner.
 */
export class Atlas {
  constructor(palette) {
    this.palette = palette;
    this.images = new Map();
  }

  /** Ajoute un motif texte sous un nom. Cree aussi la version "_miroir". */
  ajouterMotif(nom, motif, options = {}) {
    this.images.set(nom, motifVersImage(motif, this.palette, options));
    this.images.set(`${nom}_miroir`, motifVersImage(motif, this.palette, { ...options, retourner: true }));
    return this;
  }

  /** Ajoute une image deja fabriquee (tuile generee, sprite charge...). */
  ajouterImage(nom, canvas) {
    this.images.set(nom, canvas);
    return this;
  }

  image(nom) {
    return this.images.get(nom) || null;
  }

  possede(nom) {
    return this.images.has(nom);
  }

  /** Version coloree d'un sprite (ennemi rouge, variante d'objet...). */
  teinter(nom, couleur) {
    const cle = `${nom}__teinte_${couleur}`;
    if (this.images.has(cle)) return this.images.get(cle);
    const source = this.image(nom);
    if (!source) return null;
    const { canvas, ctx } = creerCanvas(source.width, source.height);
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, source.width, source.height);
    // On remet la transparence d'origine (le multiply colore aussi le vide).
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(source, 0, 0);
    this.images.set(cle, canvas);
    return canvas;
  }

  /** Version toute blanche d'un sprite : sert au flash quand on prend un coup. */
  silhouette(nom, couleur = '#ffffff') {
    const cle = `${nom}__flash_${couleur}`;
    if (this.images.has(cle)) return this.images.get(cle);
    const source = this.image(nom);
    if (!source) return null;
    const { canvas, ctx } = creerCanvas(source.width, source.height);
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, source.width, source.height);
    this.images.set(cle, canvas);
    return canvas;
  }
}

/* ------------------------------------------------------------------ */
/* Textures de tuiles : generees par du code (herbe, eau, pierre...).  */
/* ------------------------------------------------------------------ */

/** Petit "hasard" toujours identique pour une meme case : la carte ne clignote pas. */
export function bruit(x, y, graine = 1) {
  let n = Math.sin(x * 127.1 + y * 311.7 + graine * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Fabrique une tuile de `taille` pixels a partir d'une recette :
 *   { base:'#4a8', ombre:'#387', accent:'#6c9', style:'herbe' }
 * Styles disponibles : plat, herbe, pierre, eau, sable, bois, brique, terre.
 */
export function fabriquerTuile(recette, taille = 16, graine = 1) {
  const { canvas, ctx } = creerCanvas(taille, taille);
  const base = recette.base || '#444444';
  const ombre = recette.ombre || base;
  const accent = recette.accent || ombre;
  const style = recette.style || 'plat';

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, taille, taille);

  const point = (x, y, couleur, l = 1, h = 1) => {
    ctx.fillStyle = couleur;
    ctx.fillRect(x, y, l, h);
  };

  switch (style) {
    case 'herbe':
      for (let i = 0; i < taille * 1.6; i++) {
        const x = Math.floor(bruit(i, graine, 3) * taille);
        const y = Math.floor(bruit(graine, i, 7) * taille);
        point(x, y, bruit(x, y, graine) > 0.5 ? ombre : accent);
        if (bruit(x, y, graine + 5) > 0.75) point(x, y - 1, accent);
      }
      break;
    case 'pierre':
      for (let y = 0; y < taille; y += 4) {
        for (let x = 0; x < taille; x += 4) {
          const b = bruit(x, y, graine);
          point(x, y, b > 0.6 ? accent : b > 0.3 ? ombre : base, 4, 4);
        }
      }
      point(0, 0, accent, taille, 1);
      point(0, taille - 1, ombre, taille, 1);
      break;
    case 'brique':
      point(0, 0, ombre, taille, taille);
      for (let y = 0; y < taille; y += 5) {
        const decalage = (y / 5) % 2 === 0 ? 0 : 4;
        for (let x = -decalage; x < taille; x += 8) {
          point(x + 1, y + 1, base, 6, 3);
        }
      }
      point(0, 0, accent, taille, 1);
      break;
    case 'eau':
      for (let y = 0; y < taille; y++) {
        for (let x = 0; x < taille; x++) {
          const b = bruit(x, Math.floor(y / 2), graine);
          if (b > 0.82) point(x, y, accent);
          else if (b < 0.2) point(x, y, ombre);
        }
      }
      break;
    case 'sable':
      for (let i = 0; i < taille * 2; i++) {
        const x = Math.floor(bruit(i, graine, 11) * taille);
        const y = Math.floor(bruit(graine, i, 13) * taille);
        point(x, y, bruit(x, y, graine) > 0.5 ? ombre : accent);
      }
      break;
    case 'bois':
      for (let y = 0; y < taille; y += 4) {
        point(0, y, ombre, taille, 1);
        for (let x = 0; x < taille; x += 3) {
          if (bruit(x, y, graine) > 0.7) point(x, y + 2, accent, 2, 1);
        }
      }
      break;
    case 'terre':
      for (let i = 0; i < taille; i++) {
        const x = Math.floor(bruit(i, graine, 17) * taille);
        const y = Math.floor(bruit(graine, i, 19) * taille);
        point(x, y, ombre, 2, 1);
        if (bruit(x, y, graine) > 0.8) point(x, y, accent, 1, 1);
      }
      break;
    default: // plat
      break;
  }

  if (recette.bordure) {
    ctx.strokeStyle = recette.bordure;
    ctx.strokeRect(0.5, 0.5, taille - 1, taille - 1);
  }
  return canvas;
}
