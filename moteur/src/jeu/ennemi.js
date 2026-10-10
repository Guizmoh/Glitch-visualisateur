/* =========================================================================
   ennemi.js — Un ennemi = une fiche (dans contenu/ennemis.js)
                          + un comportement (dans comportements.js).
   ========================================================================= */

import { Acteur } from './entite.js';
import { Animation, Animateur } from '../noyau/animation.js';
import { deplacer } from './physique.js';
import { COMPORTEMENTS } from './comportements.js';
import { ENNEMIS } from '../contenu/ennemis.js';
import { lacherButin } from './ramassable.js';
import { evenements } from '../noyau/evenements.js';

export class Ennemi extends Acteur {
  constructor(options = {}) {
    const fiche = ENNEMIS[options.espece] || {};
    const donnees = { ...fiche, ...options };

    super({
      largeur: donnees.largeur ?? 12,
      hauteur: donnees.hauteur ?? 10,
      pvMax: donnees.pv ?? 4,
      pv: donnees.pv ?? 4,
      vitesse: donnees.vitesse ?? 40,
      degatsContact: donnees.degats ?? 1,
      equipe: 'ennemi',
      echelleSprite: donnees.echelle ?? 1,
      teinte: donnees.teinte || null,
      ...options,
      type: 'ennemi',
      donnees,
    });

    this.espece = options.espece || 'gluant';
    this.nom = donnees.nom || this.espece;
    this.comportement = donnees.ia || 'errant';
    this.portee = donnees.portee ?? 90;
    this.forceRecul = donnees.forceRecul ?? 140;
    this.butin = donnees.butin || null;
    this.memoire = {}; // le "cerveau" garde ses infos ici
    this.hauteurSaut = 0;
    this.capacites = donnees.capacites || (donnees.ia === 'volant' ? { vole: true } : {});
    this.traverseMurs = !!this.capacites.vole;
    this.estBoss = !!donnees.boss;
    this.drapeauMort = donnees.drapeau || null; // pour ne pas le faire revenir

    const base = donnees.sprite || this.espece;
    const images = donnees.images || [`${base}_0`, `${base}_1`];
    this.animateur = new Animateur({
      vie: new Animation(images.filter(Boolean), donnees.vitesseAnimation ?? 4),
    }, 'vie');
    this.decalageSpriteY = donnees.decalageSpriteY ?? 2;
  }

  /** Avance dans une direction en tenant compte des murs. */
  avancer(dx, dy, vitesse, dt, scene) {
    const resultat = deplacer(
      this,
      dx * vitesse * dt,
      dy * vitesse * dt,
      scene.carte,
      scene.entitesSolides
    );
    return resultat;
  }

  maj(dt, scene) {
    this.majEtats(dt);
    if (!this.enVie) return;

    // 1. Le recul apres un coup prend le dessus sur le comportement.
    if (this.reculRestant > 0) {
      deplacer(this, this.reculX * dt, this.reculY * dt, scene.carte, scene.entitesSolides);
    } else {
      const cerveau = COMPORTEMENTS[this.comportement] || COMPORTEMENTS.errant;
      cerveau(this, dt, scene);
    }

    // 2. Degats au contact du heros.
    const joueur = scene.joueur;
    if (joueur && joueur.enVie && this.degatsContact > 0 && this.touche(joueur)) {
      joueur.subirDegats(this.degatsContact, this, scene);
    }

    // 3. Animation + effet de saut.
    this.animateur.maj(dt);
    this.decalageSpriteY = (this.donnees.decalageSpriteY ?? 2) + Math.round(this.hauteurSaut);
  }

  mourir(scene) {
    this.vivante = false;
    if (!scene) return;
    scene.audio.jouer(this.estBoss ? 'secret' : 'mort', this.estBoss ? 1 : 1.2);
    scene.particules.emettre(this.centreX, this.centreY, {
      nombre: this.estBoss ? 40 : 14,
      couleurs: this.donnees.couleursMort || ['#ffffff', '#a8aec0', '#57526b'],
      vitesse: [40, this.estBoss ? 180 : 110],
      duree: [0.3, 0.7],
    });
    if (this.estBoss) scene.camera.secouer(5, 0.6);

    lacherButin(this.centreX, this.centreY, scene, this.butin);

    if (this.drapeauMort) scene.leverDrapeau(this.drapeauMort);
    evenements.emettre('ennemi-vaincu', { espece: this.espece, boss: this.estBoss, scene });
  }

  dessiner(ctx, scene) {
    super.dessiner(ctx, scene);
    if (this.estBoss && this.enVie) this.dessinerBarreVie(ctx, scene);
  }

  dessinerBarreVie(ctx, scene) {
    const largeur = 40;
    const x = this.centreX - largeur / 2;
    // On place la barre juste au-dessus du sprite (qui peut etre plus grand
    // que la boite de collision, comme pour un boss dessine en double).
    const image = scene.atlas.image(this.animateur?.imageActuelle || this.sprite);
    const hauteurSprite = image ? image.height * this.echelleSprite : this.hauteur;
    const y = this.y + this.hauteur - hauteurSprite - 6 + this.decalageSpriteY;
    ctx.fillStyle = '#16131f';
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, largeur + 2, 5);
    ctx.fillStyle = '#e04a4a';
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(largeur * (this.pv / this.pvMax)), 3);
  }
}
