/* =========================================================================
   joueur.js — LE HEROS.
   Il marche dans 8 directions, donne des coups d'epee, utilise un objet,
   parle aux gens, ouvre les coffres, pousse les blocs, tombe dans les trous...
   ========================================================================= */

import { Acteur } from './entite.js';
import { Animation, Animateur } from '../noyau/animation.js';
import { deplacer, tuilesSous, caseDevant } from './physique.js';
import { coupDevant } from './combat.js';
import { Projectile, Bombe } from './projectile.js';
import { normaliser, vecteurVersDirection, VECTEURS } from '../noyau/maths.js';
import { OBJETS } from '../contenu/objets.js';
import { CONFIG } from '../contenu/config.js';

export class Joueur extends Acteur {
  constructor(options = {}) {
    super({
      largeur: 10, hauteur: 9,
      pvMax: CONFIG.vieDepart, pv: CONFIG.vieDepart,
      vitesse: CONFIG.vitesseHeros,
      equipe: 'joueur',
      decalageSpriteY: 3,
      ...options,
      type: 'joueur',
    });

    this.animateur = new Animateur({
      immobile_bas: new Animation(['heros_bas_0'], 1),
      immobile_haut: new Animation(['heros_haut_0'], 1),
      immobile_droite: new Animation(['heros_droite_0'], 1),
      immobile_gauche: new Animation(['heros_droite_0_miroir'], 1),
      marche_bas: new Animation(['heros_bas_0', 'heros_bas_1'], 7),
      marche_haut: new Animation(['heros_haut_0', 'heros_haut_1'], 7),
      marche_droite: new Animation(['heros_droite_0', 'heros_droite_1'], 7),
      marche_gauche: new Animation(['heros_droite_0_miroir', 'heros_droite_1_miroir'], 7),
    }, 'immobile_bas');

    this.attaqueRestante = 0;
    this.rechargeAttaque = 0;
    this.enTrainDeTomber = 0;
    this.dernierePositionSure = { x: this.x, y: this.y };
    this.tempsPoussee = 0;
    this.cibleDePoussee = null;
    this.bloqueEntrees = false; // pendant un dialogue ou une transition
    this.tempsPas = 0;
  }

  /* ---- Boucle principale ------------------------------------------ */

  maj(dt, scene) {
    this.scene = scene; // utile aux objets qui ont besoin du contexte (bouclier)
    this.majEtats(dt);
    if (!this.enVie) return;

    // Les palmes permettent de nager.
    this.capacites.nage = scene.inventaire.possede('palmes');

    if (this.enTrainDeTomber > 0) {
      this.majChute(dt, scene);
      return;
    }

    if (this.attaqueRestante > 0) this.attaqueRestante -= dt;
    if (this.rechargeAttaque > 0) this.rechargeAttaque -= dt;

    const entrees = scene.entrees;
    const peutAgir = !this.bloqueEntrees && this.reculRestant <= 0;

    let dx = 0;
    let dy = 0;
    if (peutAgir && this.attaqueRestante <= 0) {
      dx = entrees.axeX;
      dy = entrees.axeY;
    }

    // Direction du regard
    if (dx !== 0 || dy !== 0) {
      this.direction = vecteurVersDirection(dx, dy);
    }

    // Deplacement (la diagonale n'est pas plus rapide grace a normaliser)
    const vecteur = normaliser(dx, dy);
    let vitesse = this.vitesse;
    const tuiles = tuilesSous(this, scene.carte);
    if (tuiles.some((c) => c.tuile.lent)) vitesse *= 0.55;
    if (tuiles.some((c) => c.tuile.eau) && this.capacites.nage) vitesse *= 0.7;

    let deplacementX = vecteur.x * vitesse * dt;
    let deplacementY = vecteur.y * vitesse * dt;

    // Recul quand on prend un coup
    if (this.reculRestant > 0) {
      deplacementX += this.reculX * dt;
      deplacementY += this.reculY * dt;
    }

    const resultat = deplacer(this, deplacementX, deplacementY, scene.carte, scene.entitesSolides);
    this.gererPoussee(resultat, dx, dy, dt, scene);

    // Animation
    const bouge = (dx !== 0 || dy !== 0) && this.attaqueRestante <= 0;
    this.animateur.jouer(`${bouge ? 'marche' : 'immobile'}_${this.direction}`);
    this.animateur.maj(dt);

    // Bruit de pas
    if (bouge) {
      this.tempsPas += dt;
      if (this.tempsPas > 0.3) {
        this.tempsPas = 0;
        scene.audio.jouer('pas', 0.9 + Math.random() * 0.2);
      }
    }

    // Actions
    if (peutAgir && entrees.pressee('attaque')) this.actionPrincipale(scene);
    if (peutAgir && entrees.pressee('objet')) this.utiliserObjet(scene);

    this.majDecor(dt, scene);
  }

  /* ---- Epee et interactions ---------------------------------------- */

  /**
   * La touche ATTAQUE fait deux choses :
   * s'il y a quelque chose a activer devant (PNJ, coffre, panneau) on l'active,
   * sinon on donne un coup d'epee.
   */
  actionPrincipale(scene) {
    const cible = this.chercherInteractif(scene);
    if (cible) {
      cible.interagir(scene, this);
      return;
    }
    this.attaquer(scene);
  }

  chercherInteractif(scene) {
    const devant = caseDevant(this, 10);
    let meilleure = null;
    let meilleureDistance = Infinity;
    for (const entite of scene.entites) {
      if (!entite.vivante || typeof entite.interagir !== 'function') continue;
      const distance = Math.hypot(entite.centreX - devant.x, entite.centreY - devant.y);
      if (distance < 14 && distance < meilleureDistance) {
        meilleure = entite;
        meilleureDistance = distance;
      }
    }
    return meilleure;
  }

  attaquer(scene) {
    if (!scene.inventaire.possede('epee')) return;
    if (this.rechargeAttaque > 0) return;
    this.attaqueRestante = CONFIG.dureeAttaque;
    this.rechargeAttaque = CONFIG.rechargeAttaque;
    scene.audio.jouer('epee');
    coupDevant(this, scene, {
      degats: CONFIG.degatsEpee,
      duree: CONFIG.dureeAttaque,
      casseTuiles: 'epee',
      forceRecul: 170,
    });
  }

  /* ---- Objet equipe (arc, bombes...) -------------------------------- */

  utiliserObjet(scene) {
    const nom = scene.inventaire.equipe;
    if (!nom) return;
    const def = OBJETS[nom];
    if (!def || !def.utiliser) return;
    if (def.munition && scene.inventaire[def.munition] <= 0) {
      scene.audio.jouer('erreur');
      return;
    }
    def.utiliser({ joueur: this, scene, inventaire: scene.inventaire });
  }

  tirerFleche(scene) {
    if (!scene.inventaire.depenser('fleches', 1)) return;
    const vecteur = VECTEURS[this.direction];
    scene.ajouter(new Projectile({
      x: this.centreX - 3 + vecteur.x * 8,
      y: this.centreY - 3 + vecteur.y * 8,
      vx: vecteur.x * 190,
      vy: vecteur.y * 190,
      sprite: 'fleche',
      degats: CONFIG.degatsFleche,
      equipe: 'joueur',
      proprietaire: this,
    }));
    scene.audio.jouer('tir');
  }

  poserBombe(scene) {
    if (!scene.inventaire.depenser('bombes', 1)) return;
    const vecteur = VECTEURS[this.direction];
    scene.ajouter(new Bombe({
      x: this.centreX - 5 + vecteur.x * 12,
      y: this.centreY - 4 + vecteur.y * 12,
    }));
    scene.audio.jouer('bloc');
  }

  /** Le bouclier arrete les projectiles qui arrivent de face. */
  bloqueProjectile(projectile) {
    if (!this.scene || !this.scene.inventaire.possede('bouclier')) return false;
    const vientDe = vecteurVersDirection(-projectile.vx, -projectile.vy);
    return vientDe === this.direction;
  }

  /* ---- Pousser les blocs -------------------------------------------- */

  gererPoussee(resultat, dx, dy, dt, scene) {
    const bloqueur = resultat.bloquePar;
    if (bloqueur && typeof bloqueur.pousser === 'function' && (dx !== 0 || dy !== 0)) {
      if (this.cibleDePoussee !== bloqueur) {
        this.cibleDePoussee = bloqueur;
        this.tempsPoussee = 0;
      }
      this.tempsPoussee += dt;
      if (this.tempsPoussee > CONFIG.tempsAvantPoussee) {
        this.tempsPoussee = 0;
        bloqueur.pousser(this.direction, scene);
      }
    } else {
      this.cibleDePoussee = null;
      this.tempsPoussee = 0;
    }
  }

  /* ---- Pics, trous, eau --------------------------------------------- */

  majDecor(dt, scene) {
    const centre = scene.carte.tuileEnPixels(this.centreX, this.centreY);
    if (!centre) return;

    if (centre.degats && this.invincible <= 0) {
      this.subirDegats(centre.degats, null, scene);
      // On repousse le heros vers sa derniere position sure.
      this.x = this.dernierePositionSure.x;
      this.y = this.dernierePositionSure.y;
      scene.audio.jouer('degat');
      return;
    }

    if (centre.trou) {
      this.commencerChute(scene);
      return;
    }

    // Memorise la derniere case bien solide (pour remonter des trous).
    if (!centre.trou && !centre.eau && !centre.degats) {
      this.dernierePositionSure = { x: this.x, y: this.y };
    }
  }

  commencerChute(scene) {
    if (this.enTrainDeTomber > 0) return;
    this.enTrainDeTomber = 0.6;
    this.vx = 0;
    this.vy = 0;
    scene.audio.jouer('erreur');
  }

  majChute(dt, scene) {
    this.enTrainDeTomber -= dt;
    this.echelleSprite = Math.max(0.05, this.enTrainDeTomber / 0.6);
    this.opacite = Math.max(0, this.enTrainDeTomber / 0.6);
    if (this.enTrainDeTomber <= 0) {
      this.echelleSprite = 1;
      this.opacite = 1;
      this.x = this.dernierePositionSure.x;
      this.y = this.dernierePositionSure.y;
      this.subirDegats(CONFIG.degatsChute, null, scene);
      this.invincible = this.dureeInvincibilite;
    }
  }

  /* ---- Dessin -------------------------------------------------------- */

  dessiner(ctx, scene) {
    super.dessiner(ctx, scene);
    if (this.attaqueRestante > 0) this.dessinerEpee(ctx, scene);
  }

  dessinerEpee(ctx, scene) {
    const image = scene.atlas.image('epee');
    if (!image) return;
    const avancee = 1 - Math.abs(this.attaqueRestante / CONFIG.dureeAttaque - 0.5) * 2;
    const distance = 4 + avancee * 8;
    const angles = { haut: 0, droite: Math.PI / 2, bas: Math.PI, gauche: -Math.PI / 2 };
    const vecteur = VECTEURS[this.direction];
    ctx.save();
    ctx.translate(
      Math.round(this.centreX + vecteur.x * distance),
      Math.round(this.centreY + vecteur.y * distance - 2)
    );
    ctx.rotate(angles[this.direction] || 0);
    ctx.drawImage(image, -image.width / 2, -image.height + 2);
    ctx.restore();
  }

  mourir(scene) {
    this.vivante = false;
    if (scene) {
      scene.audio.jouer('mort');
      scene.particules.emettre(this.centreX, this.centreY, {
        nombre: 24, couleurs: ['#57c96a', '#f7c9a3', '#ffffff'], vitesse: [40, 140],
      });
    }
  }
}
