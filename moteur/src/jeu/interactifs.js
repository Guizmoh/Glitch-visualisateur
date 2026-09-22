/* =========================================================================
   interactifs.js — Tout ce avec quoi on peut jouer dans le decor :
   coffres, panneaux, blocs a pousser, dalles, cristaux, portes, escaliers.
   ========================================================================= */

import { Entite } from './entite.js';
import { Ramassable } from './ramassable.js';
import { OBJETS } from '../contenu/objets.js';
import { TAILLE_TUILE } from '../monde/tuileset.js';
import { VECTEURS } from '../noyau/maths.js';

/* --------------------------------------------------------------------- */
/* LE COFFRE                                                              */
/* --------------------------------------------------------------------- */
export class Coffre extends Entite {
  constructor(options = {}) {
    super({
      largeur: 14, hauteur: 12, solide: true, ombre: false,
      sprite: 'coffre_ferme', decalageSpriteY: 2,
      ...options, type: 'coffre',
    });
    this.contenu = options.contenu || 'rubis_bleu';
    this.quantite = options.quantite || 1;
    this.drapeau = options.drapeau || null; // pour rester ouvert apres coup
    this.verrouille = options.verrouille || false; // demande une petite cle
    this.ouvert = false;
  }

  /** Appele par la scene si le coffre a deja ete ouvert dans cette partie. */
  marquerOuvert() {
    this.ouvert = true;
    this.sprite = 'coffre_ouvert';
  }

  interagir(scene, joueur) {
    if (this.ouvert) return;
    if (this.verrouille && !scene.inventaire.depenser('cles', 1)) {
      scene.dialogue.montrer(['Ce coffre est verrouille. Il te faut une petite cle.']);
      scene.audio.jouer('erreur');
      return;
    }
    this.ouvert = true;
    this.sprite = 'coffre_ouvert';
    scene.audio.jouer('coffre');
    scene.particules.emettre(this.centreX, this.centreY - 4, {
      nombre: 16, couleurs: ['#f2c14b', '#ffffff'], vitesse: [20, 70], duree: [0.4, 0.8],
    });
    if (this.drapeau) scene.leverDrapeau(this.drapeau);

    const def = OBJETS[this.contenu];
    if (def && def.permanent) {
      scene.inventaire.donner(this.contenu);
      if (def.ramasser) def.ramasser({ joueur, inventaire: scene.inventaire, scene });
      scene.montrerObjetTrouve(this.contenu, def.message || `Tu as trouve : ${def.nom} !`);
    } else {
      for (let i = 0; i < this.quantite; i++) {
        scene.ajouter(new Ramassable({
          objet: this.contenu,
          x: this.centreX - 4 + i * 5,
          y: this.y + this.hauteur + 2,
          saut: true,
        }));
      }
    }
  }
}

/* --------------------------------------------------------------------- */
/* LE PANNEAU (un texte a lire)                                           */
/* --------------------------------------------------------------------- */
export class Panneau extends Entite {
  constructor(options = {}) {
    super({
      largeur: 12, hauteur: 10, solide: true, ombre: false,
      sprite: options.sprite || null, ...options, type: 'panneau',
    });
    this.texte = Array.isArray(options.texte) ? options.texte : [options.texte || '...'];
  }

  interagir(scene) {
    scene.dialogue.montrer(this.texte, { titre: 'Panneau' });
  }

  dessiner(ctx, scene) {
    if (this.sprite) return super.dessiner(ctx, scene);
    // Petit panneau en bois dessine a la volee.
    ctx.fillStyle = '#8b5a3c';
    ctx.fillRect(Math.round(this.centreX) - 1, Math.round(this.y) + 6, 2, 6);
    ctx.fillStyle = '#c08552';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 12, 8);
    ctx.fillStyle = '#16131f';
    ctx.fillRect(Math.round(this.x) + 2, Math.round(this.y) + 2, 8, 1);
    ctx.fillRect(Math.round(this.x) + 2, Math.round(this.y) + 4, 6, 1);
  }
}

/* --------------------------------------------------------------------- */
/* LE BLOC A POUSSER                                                      */
/* --------------------------------------------------------------------- */
export class BlocPoussable extends Entite {
  constructor(options = {}) {
    super({
      largeur: 16, hauteur: 16, solide: true, ombre: false,
      ...options, type: 'bloc',
    });
    this.enMouvement = null;
    this.unSeulDeplacement = options.unSeulDeplacement ?? false;
    this.dejaPousse = false;
  }

  pousser(direction, scene) {
    if (this.enMouvement || (this.unSeulDeplacement && this.dejaPousse)) return false;
    const vecteur = VECTEURS[direction];
    const cibleX = this.x + vecteur.x * TAILLE_TUILE;
    const cibleY = this.y + vecteur.y * TAILLE_TUILE;

    // La case d'arrivee est-elle libre ?
    const test = new Entite({ x: cibleX + 2, y: cibleY + 2, largeur: 12, hauteur: 12 });
    const col = Math.floor((cibleX + 8) / TAILLE_TUILE);
    const ligne = Math.floor((cibleY + 8) / TAILLE_TUILE);
    if (scene.carte.estSolide(col, ligne)) {
      scene.audio.jouer('erreur');
      return false;
    }
    for (const autre of scene.entites) {
      if (autre !== this && autre.solide && autre.vivante && test.touche(autre)) return false;
    }

    this.enMouvement = { depuisX: this.x, depuisY: this.y, versX: cibleX, versY: cibleY, temps: 0 };
    this.dejaPousse = true;
    scene.audio.jouer('pousser');
    return true;
  }

  maj(dt, scene) {
    if (!this.enMouvement) return;
    const m = this.enMouvement;
    m.temps += dt / 0.25;
    if (m.temps >= 1) {
      this.x = m.versX;
      this.y = m.versY;
      this.enMouvement = null;
      scene.particules.emettre(this.centreX, this.y + this.hauteur, {
        nombre: 6, couleurs: ['#c9b89a', '#a08f74'], vitesse: [10, 40], duree: [0.2, 0.4],
      });
      scene.verifierDalles();
      return;
    }
    this.x = m.depuisX + (m.versX - m.depuisX) * m.temps;
    this.y = m.depuisY + (m.versY - m.depuisY) * m.temps;
  }

  dessiner(ctx, scene) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = '#7b8496';
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = '#a0a8ba';
    ctx.fillRect(x + 1, y + 1, 14, 2);
    ctx.fillStyle = '#5b6272';
    ctx.fillRect(x + 1, y + 13, 14, 2);
    ctx.fillStyle = '#16131f';
    ctx.strokeStyle = '#16131f';
    ctx.strokeRect(x + 0.5, y + 0.5, 15, 15);
    ctx.fillRect(x + 4, y + 6, 8, 1);
    ctx.fillRect(x + 7, y + 4, 1, 8);
  }
}

/* --------------------------------------------------------------------- */
/* LA DALLE DE PRESSION (tuile 'I')                                       */
/* --------------------------------------------------------------------- */
export class Dalle extends Entite {
  constructor(options = {}) {
    super({
      largeur: 14, hauteur: 14, ombre: false, ...options, type: 'dalle',
    });
    this.pressee = false;
    this.permanente = options.permanente ?? true;
  }

  estPressee(scene) {
    for (const entite of scene.entites) {
      if (!entite.vivante) continue;
      if (entite.type !== 'bloc' && entite !== scene.joueur) continue;
      if (this.touche(entite, -2)) return true;
    }
    return false;
  }

  maj(dt, scene) {
    const maintenant = this.estPressee(scene);
    if (maintenant && !this.pressee) {
      this.pressee = true;
      scene.audio.jouer('bloc');
      scene.ouvrirBarreaux();
    } else if (!maintenant && this.pressee && !this.permanente) {
      this.pressee = false;
      scene.fermerBarreaux();
    }
  }

  dessiner(ctx, scene) {
    if (!this.pressee) return;
    ctx.fillStyle = '#f2c14b';
    ctx.globalAlpha = 0.35;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.largeur, this.hauteur);
    ctx.globalAlpha = 1;
  }
}

/* --------------------------------------------------------------------- */
/* LE CRISTAL (tuile 'c') : on le frappe a l'epee pour ouvrir les grilles  */
/* --------------------------------------------------------------------- */
export class Cristal extends Entite {
  constructor(options = {}) {
    super({
      largeur: 12, hauteur: 12, ombre: false, equipe: 'ennemi',
      ...options, type: 'cristal',
    });
    this.active = false;
    this.col = options.col;
    this.ligne = options.ligne;
  }

  /** Frappe par une zone de degats : il compte comme une "cible". */
  subirDegats(degats, source, scene) {
    if (this.active || !scene) return false;
    this.active = true;
    scene.audio.jouer('secret');
    scene.particules.emettre(this.centreX, this.centreY, {
      nombre: 14, couleurs: ['#7ee0e8', '#ffffff', '#8a5ad9'], vitesse: [30, 90],
    });
    scene.ouvrirBarreaux();
    return true;
  }

  dessiner(ctx, scene) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(scene.temps * 6) * 0.2;
    ctx.fillStyle = '#7ee0e8';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.largeur, this.hauteur);
    ctx.restore();
  }
}

/* --------------------------------------------------------------------- */
/* LES PORTES VERROUILLEES (tuiles 'D' et 'B')                            */
/* --------------------------------------------------------------------- */
export class PorteVerrouillee extends Entite {
  constructor(options = {}) {
    super({
      largeur: 16, hauteur: 16, ombre: false, ...options, type: 'porte',
    });
    this.col = options.col;
    this.ligne = options.ligne;
    this.boss = options.boss || false;
    this.solAApparaitre = options.solAApparaitre || 'F';
  }

  interagir(scene, joueur) {
    if (this.boss) {
      if (!scene.inventaire.possede('cle_boss')) {
        scene.dialogue.montrer(['Une porte enorme... Il faut la CLE DU BOSS.']);
        scene.audio.jouer('erreur');
        return;
      }
    } else if (!scene.inventaire.depenser('cles', 1)) {
      scene.dialogue.montrer(['C\'est ferme a cle. Cherche une petite cle !']);
      scene.audio.jouer('erreur');
      return;
    }
    this.ouvrir(scene);
  }

  ouvrir(scene) {
    scene.carte.remplacer(this.col, this.ligne, this.solAApparaitre);
    scene.audio.jouer('porte');
    scene.particules.emettre(this.centreX, this.centreY, {
      nombre: 12, couleurs: ['#f2c14b', '#ffffff'], vitesse: [20, 60],
    });
    scene.leverDrapeau(`porte-${scene.carte.nom}-${this.col}-${this.ligne}`);
    this.detruire();
  }
}

/* --------------------------------------------------------------------- */
/* LE PASSAGE (escalier, grotte, teleporteur)                             */
/* --------------------------------------------------------------------- */
export class Passage extends Entite {
  constructor(options = {}) {
    super({
      largeur: 10, hauteur: 8, ombre: false, ...options, type: 'passage',
    });
    this.vers = options.vers;
    this.arrivee = options.arrivee || null; // [colonne, ligne] dans la salle d'arrivee
    this.delai = 0.2;
    this.dejaUtilise = false;
  }

  maj(dt, scene) {
    if (this.dejaUtilise || !this.vers) return;
    const joueur = scene.joueur;
    if (joueur && joueur.enVie && this.touche(joueur, -2)) {
      this.dejaUtilise = true;
      scene.audio.jouer('porte');
      scene.changerDeSalle(this.vers, { arrivee: this.arrivee, fondu: true });
    }
  }
}
