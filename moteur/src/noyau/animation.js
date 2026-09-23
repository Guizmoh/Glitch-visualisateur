/* =========================================================================
   animation.js — Fait bouger les sprites.
   Une animation = une liste d'images + une vitesse.
   ========================================================================= */

export class Animation {
  /**
   * @param {string[]} images  noms des images dans l'atlas
   * @param {number} vitesse   images par seconde
   * @param {boolean} boucle   recommencer a la fin ?
   */
  constructor(images, vitesse = 8, boucle = true) {
    this.images = images;
    this.vitesse = vitesse;
    this.boucle = boucle;
  }
}

export class Animateur {
  constructor(animations = {}, depart = null) {
    this.animations = animations;
    this.nom = depart || Object.keys(animations)[0] || null;
    this.index = 0;
    this.temps = 0;
    this.finie = false;
  }

  /** Change d'animation (ne redemarre pas si c'est deja la meme). */
  jouer(nom, forcerRedemarrage = false) {
    if (!this.animations[nom]) return;
    if (this.nom === nom && !forcerRedemarrage) return;
    this.nom = nom;
    this.index = 0;
    this.temps = 0;
    this.finie = false;
  }

  maj(dt) {
    const animation = this.animations[this.nom];
    if (!animation || animation.images.length <= 1) return;
    this.temps += dt;
    const parImage = 1 / animation.vitesse;
    while (this.temps >= parImage) {
      this.temps -= parImage;
      this.index++;
      if (this.index >= animation.images.length) {
        if (animation.boucle) {
          this.index = 0;
        } else {
          this.index = animation.images.length - 1;
          this.finie = true;
        }
      }
    }
  }

  /** Nom de l'image a afficher maintenant. */
  get imageActuelle() {
    const animation = this.animations[this.nom];
    if (!animation) return null;
    return animation.images[Math.min(this.index, animation.images.length - 1)];
  }
}
