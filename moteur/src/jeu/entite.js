/* =========================================================================
   entite.js — Tout ce qui vit dans une salle est une "Entite" :
   le heros, les ennemis, les coeurs par terre, les coffres, les fleches...
   ========================================================================= */

import { Animateur } from '../noyau/animation.js';
import { ombrePortee } from '../noyau/rendu.js';

let prochainId = 1;

export class Entite {
  constructor(options = {}) {
    this.id = prochainId++;
    this.type = options.type || 'entite';
    this.nom = options.nom || this.type;

    // Position et taille de la BOITE DE COLLISION (pas du dessin).
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.largeur = options.largeur ?? 12;
    this.hauteur = options.hauteur ?? 10;

    // Vitesse actuelle, en pixels par seconde.
    this.vx = 0;
    this.vy = 0;

    this.direction = options.direction || 'bas';
    this.vivante = true;
    this.actif = true;

    // Dessin
    this.sprite = options.sprite || null;
    this.animateur = options.animations ? new Animateur(options.animations) : null;
    this.echelleSprite = options.echelleSprite || 1;
    this.decalageSpriteY = options.decalageSpriteY || 0;
    this.ombre = options.ombre ?? true;
    this.flash = 0; // > 0 = dessine en blanc (quand on prend un coup)
    this.teinte = options.teinte || null; // recolorer le sprite (variante d'ennemi)
    this.opacite = 1;
    this.profondeur = options.profondeur ?? 0; // pour trier ce qui est devant

    // Comportement physique
    this.solide = options.solide ?? false; // bloque les autres entites
    this.traverseMurs = options.traverseMurs ?? false;
    this.capacites = options.capacites || {}; // { nage:true, vole:true }
    this.pousseeSubie = { x: 0, y: 0 };

    this.equipe = options.equipe || 'neutre'; // 'joueur' | 'ennemi' | 'neutre'
    this.donnees = options.donnees || {};
  }

  get centreX() {
    return this.x + this.largeur / 2;
  }

  get centreY() {
    return this.y + this.hauteur / 2;
  }

  set centreX(valeur) {
    this.x = valeur - this.largeur / 2;
  }

  set centreY(valeur) {
    this.y = valeur - this.hauteur / 2;
  }

  /** Boite de collision, pratique pour les tests de contact. */
  get boite() {
    return { x: this.x, y: this.y, l: this.largeur, h: this.hauteur };
  }

  /** Est-ce que cette entite touche l'autre ? */
  touche(autre, marge = 0) {
    return (
      this.x - marge < autre.x + autre.largeur &&
      this.x + this.largeur + marge > autre.x &&
      this.y - marge < autre.y + autre.hauteur &&
      this.y + this.hauteur + marge > autre.y
    );
  }

  distanceVers(autre) {
    return Math.hypot(autre.centreX - this.centreX, autre.centreY - this.centreY);
  }

  /** A redefinir dans les classes filles. */
  maj(dt, scene) {}

  /** Appele quand une autre entite nous touche. */
  surContact(autre, scene) {}

  dessiner(ctx, scene) {
    const atlas = scene.atlas;
    const nomImage = this.animateur ? this.animateur.imageActuelle : this.sprite;
    if (!nomImage) return;
    const image = this.flash > 0
      ? atlas.silhouette(nomImage, '#ffffff')
      : this.teinte
        ? atlas.teinter(nomImage, this.teinte)
        : atlas.image(nomImage);
    if (!image) return;

    const l = image.width * this.echelleSprite;
    const h = image.height * this.echelleSprite;
    const x = Math.round(this.centreX - l / 2);
    const y = Math.round(this.y + this.hauteur - h + this.decalageSpriteY);

    if (this.ombre) {
      ombrePortee(ctx, this.centreX, this.y + this.hauteur - 1, this.largeur);
    }
    if (this.opacite < 1) {
      ctx.save();
      ctx.globalAlpha = this.opacite;
      ctx.drawImage(image, x, y, l, h);
      ctx.restore();
    } else {
      ctx.drawImage(image, x, y, l, h);
    }
  }

  detruire() {
    this.vivante = false;
  }
}

/* ===================================================================== */

/**
 * Un ACTEUR est une entite qui a des points de vie : heros, ennemis, PNJ.
 * Les points de vie se comptent en DEMI-COEURS (2 = un coeur plein).
 */
export class Acteur extends Entite {
  constructor(options = {}) {
    super(options);
    this.pvMax = options.pvMax ?? 6;
    this.pv = options.pv ?? this.pvMax;
    this.vitesse = options.vitesse ?? 60;
    this.degatsContact = options.degatsContact ?? 0;
    this.invincible = 0; // secondes restantes
    this.dureeInvincibilite = options.dureeInvincibilite ?? 0.8;
    this.reculX = 0;
    this.reculY = 0;
    this.reculRestant = 0;
    this.butin = options.butin || null;
    this.ignoreRecul = options.ignoreRecul ?? false;
  }

  get enVie() {
    return this.pv > 0 && this.vivante;
  }

  /** Recoit des degats. Retourne vrai si le coup est passe. */
  subirDegats(degats, source = null, scene = null) {
    if (this.invincible > 0 || !this.enVie) return false;
    this.pv = Math.max(0, this.pv - degats);
    this.invincible = this.dureeInvincibilite;
    this.flash = 0.12;

    if (source && !this.ignoreRecul) {
      const dx = this.centreX - source.centreX;
      const dy = this.centreY - source.centreY;
      const longueur = Math.hypot(dx, dy) || 1;
      const force = source.forceRecul ?? 150;
      this.reculX = (dx / longueur) * force;
      this.reculY = (dy / longueur) * force;
      this.reculRestant = 0.18;
    }

    if (this.pv <= 0) this.mourir(scene);
    return true;
  }

  soigner(demiCoeurs) {
    this.pv = Math.min(this.pvMax, this.pv + demiCoeurs);
  }

  mourir(scene) {
    this.vivante = false;
  }

  /** Met a jour les minuteurs communs (invincibilite, recul, flash). */
  majEtats(dt) {
    if (this.invincible > 0) this.invincible -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.reculRestant > 0) {
      this.reculRestant -= dt;
      if (this.reculRestant <= 0) {
        this.reculX = 0;
        this.reculY = 0;
      }
    }
    // Clignotement pendant l'invincibilite.
    this.opacite = this.invincible > 0 && Math.floor(this.invincible * 20) % 2 === 0 ? 0.45 : 1;
  }
}
