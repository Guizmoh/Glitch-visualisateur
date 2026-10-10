/* =========================================================================
   comportements.js — LES CERVEAUX DES ENNEMIS.
   Chaque comportement est une petite fonction. Pour inventer un ennemi,
   tu peux reutiliser un comportement existant... ou en ecrire un nouveau !

     COMPORTEMENTS.mon_ennemi = (ennemi, dt, scene) => { ... };

   Dans la fonction tu peux utiliser :
     ennemi.memoire   -> pour se souvenir de trucs entre deux images
     scene.joueur     -> le heros
     ennemi.allerVers(x, y, dt, scene)
     ennemi.distanceVers(scene.joueur)
   ========================================================================= */

import { VECTEURS, auHasard, hasard, chance, vecteurVersDirection, normaliser } from '../noyau/maths.js';
import { Projectile } from './projectile.js';

const DIRECTIONS = ['haut', 'bas', 'gauche', 'droite'];

export const COMPORTEMENTS = {
  /** Ne bouge pas d'un poil (statue, plante carnivore). */
  immobile(ennemi, dt, scene) {
    ennemi.vx = 0;
    ennemi.vy = 0;
  },

  /** Se promene au hasard et change de direction de temps en temps. */
  errant(ennemi, dt, scene) {
    const m = ennemi.memoire;
    m.minuteur = (m.minuteur ?? 0) - dt;
    if (m.minuteur <= 0 || m.bloque) {
      m.direction = auHasard(DIRECTIONS);
      m.minuteur = hasard(0.6, 1.8);
      m.bloque = false;
    }
    const vecteur = VECTEURS[m.direction];
    ennemi.direction = m.direction;
    const resultat = ennemi.avancer(vecteur.x, vecteur.y, ennemi.vitesse, dt, scene);
    if (resultat.murX || resultat.murY) m.bloque = true;
  },

  /** Fonce vers le heros des qu'il est dans son champ de vision. */
  poursuite(ennemi, dt, scene) {
    const joueur = scene.joueur;
    if (!joueur || !joueur.enVie) return COMPORTEMENTS.errant(ennemi, dt, scene);
    const distance = ennemi.distanceVers(joueur);
    if (distance > (ennemi.portee ?? 90)) {
      return COMPORTEMENTS.errant(ennemi, dt, scene);
    }
    const vecteur = normaliser(joueur.centreX - ennemi.centreX, joueur.centreY - ennemi.centreY);
    ennemi.direction = vecteurVersDirection(vecteur.x, vecteur.y);
    ennemi.avancer(vecteur.x, vecteur.y, ennemi.vitesse, dt, scene);
  },

  /** Fait des bonds reguliers vers le heros (le gluant classique). */
  sauteur(ennemi, dt, scene) {
    const m = ennemi.memoire;
    m.phase = m.phase || 'attente';
    m.minuteur = (m.minuteur ?? 0) - dt;

    if (m.phase === 'attente') {
      ennemi.hauteurSaut = 0;
      if (m.minuteur <= 0) {
        m.phase = 'saut';
        m.minuteur = 0.45;
        const joueur = scene.joueur;
        const vers = joueur && joueur.enVie
          ? normaliser(joueur.centreX - ennemi.centreX, joueur.centreY - ennemi.centreY)
          : { x: hasard(-1, 1), y: hasard(-1, 1) };
        m.vecteur = vers;
        ennemi.direction = vecteurVersDirection(vers.x, vers.y);
      }
    } else {
      // Pendant le saut : on avance et on monte puis on redescend.
      const progression = 1 - m.minuteur / 0.45;
      ennemi.hauteurSaut = -Math.sin(progression * Math.PI) * 8;
      ennemi.avancer(m.vecteur.x, m.vecteur.y, ennemi.vitesse * 1.9, dt, scene);
      if (m.minuteur <= 0) {
        m.phase = 'attente';
        m.minuteur = hasard(0.5, 1.1);
        ennemi.hauteurSaut = 0;
      }
    }
  },

  /** Vole en zigzag et traverse les murs (chauve-souris). */
  volant(ennemi, dt, scene) {
    const m = ennemi.memoire;
    m.temps = (m.temps ?? 0) + dt;
    const joueur = scene.joueur;
    let dx = 0;
    let dy = 0;
    if (joueur && joueur.enVie && ennemi.distanceVers(joueur) < (ennemi.portee ?? 120)) {
      const vers = normaliser(joueur.centreX - ennemi.centreX, joueur.centreY - ennemi.centreY);
      dx = vers.x;
      dy = vers.y;
    } else {
      dx = Math.cos(m.temps * 1.4 + ennemi.id);
      dy = Math.sin(m.temps * 1.1 + ennemi.id);
    }
    // Zigzag caracteristique
    dx += Math.cos(m.temps * 7) * 0.5;
    dy += Math.sin(m.temps * 6) * 0.5;
    const vecteur = normaliser(dx, dy);
    ennemi.direction = vecteurVersDirection(vecteur.x, vecteur.y);
    ennemi.avancer(vecteur.x, vecteur.y, ennemi.vitesse, dt, scene);
  },

  /** Marche de gauche a droite (ou de haut en bas) comme une sentinelle. */
  patrouille(ennemi, dt, scene) {
    const m = ennemi.memoire;
    if (!m.direction) m.direction = ennemi.donnees.axe === 'vertical' ? 'bas' : 'droite';
    const vecteur = VECTEURS[m.direction];
    ennemi.direction = m.direction;
    const resultat = ennemi.avancer(vecteur.x, vecteur.y, ennemi.vitesse, dt, scene);
    if (resultat.murX || resultat.murY) {
      const opposes = { haut: 'bas', bas: 'haut', gauche: 'droite', droite: 'gauche' };
      m.direction = opposes[m.direction];
    }
  },

  /** Garde ses distances et tire des projectiles. */
  tireur(ennemi, dt, scene) {
    const joueur = scene.joueur;
    const m = ennemi.memoire;
    m.recharge = (m.recharge ?? hasard(0.5, 1.5)) - dt;
    if (!joueur || !joueur.enVie) return;
    const distance = ennemi.distanceVers(joueur);
    const vers = normaliser(joueur.centreX - ennemi.centreX, joueur.centreY - ennemi.centreY);
    ennemi.direction = vecteurVersDirection(vers.x, vers.y);

    if (distance < 48) {
      ennemi.avancer(-vers.x, -vers.y, ennemi.vitesse * 0.8, dt, scene); // recule
    } else if (distance > 90) {
      ennemi.avancer(vers.x, vers.y, ennemi.vitesse * 0.6, dt, scene); // se rapproche
    }

    if (m.recharge <= 0 && distance < 130) {
      m.recharge = ennemi.donnees.cadence ?? 1.8;
      scene.ajouter(new Projectile({
        x: ennemi.centreX - 3, y: ennemi.centreY - 3,
        vx: vers.x * 110, vy: vers.y * 110,
        sprite: ennemi.donnees.projectile || 'boule_magie',
        degats: ennemi.donnees.degatsProjectile ?? 1,
        equipe: 'ennemi',
        proprietaire: ennemi,
        effetImpact: 'magie',
        rotation: false,
      }));
      scene.audio.jouer('tir', 0.7);
    }
  },

  /** Attend, vise, puis charge tout droit (taureau). */
  chargeur(ennemi, dt, scene) {
    const m = ennemi.memoire;
    const joueur = scene.joueur;
    m.phase = m.phase || 'guet';
    m.minuteur = (m.minuteur ?? 0) - dt;

    if (m.phase === 'guet') {
      if (!joueur || !joueur.enVie) return;
      const alignementX = Math.abs(joueur.centreX - ennemi.centreX) < 14;
      const alignementY = Math.abs(joueur.centreY - ennemi.centreY) < 14;
      if ((alignementX || alignementY) && ennemi.distanceVers(joueur) < 130) {
        m.phase = 'prepare';
        m.minuteur = 0.5;
        m.vecteur = normaliser(
          alignementX ? 0 : joueur.centreX - ennemi.centreX,
          alignementY ? 0 : joueur.centreY - ennemi.centreY
        );
        ennemi.direction = vecteurVersDirection(m.vecteur.x, m.vecteur.y);
      }
    } else if (m.phase === 'prepare') {
      ennemi.flash = Math.floor(m.minuteur * 12) % 2 === 0 ? 0.1 : 0;
      if (m.minuteur <= 0) {
        m.phase = 'charge';
        m.minuteur = 1.4;
        scene.audio.jouer('pousser');
      }
    } else {
      const resultat = ennemi.avancer(m.vecteur.x, m.vecteur.y, ennemi.vitesse * 3, dt, scene);
      if (resultat.murX || resultat.murY || m.minuteur <= 0) {
        m.phase = 'guet';
        m.minuteur = 0.6;
        scene.camera.secouer(2, 0.15);
      }
    }
  },

  /** LE BOSS : trois attaques qui s'enchainent. */
  boss_gluant(ennemi, dt, scene) {
    const m = ennemi.memoire;
    m.phase = m.phase || 'attente';
    m.minuteur = (m.minuteur ?? 1) - dt;
    const joueur = scene.joueur;

    // Plus il est blesse, plus il est rapide et nerveux.
    const rage = 1 + (1 - ennemi.pv / ennemi.pvMax) * 1.2;

    switch (m.phase) {
      case 'attente':
        ennemi.hauteurSaut = 0;
        if (m.minuteur <= 0) {
          m.phase = chance(0.4) ? 'appel' : 'bond';
          m.minuteur = m.phase === 'bond' ? 0.6 : 0.8;
          if (m.phase === 'bond' && joueur) {
            m.vecteur = normaliser(joueur.centreX - ennemi.centreX, joueur.centreY - ennemi.centreY);
          }
        }
        break;

      case 'bond': {
        const progression = 1 - Math.max(0, m.minuteur) / 0.6;
        ennemi.hauteurSaut = -Math.sin(progression * Math.PI) * 18;
        if (m.vecteur) ennemi.avancer(m.vecteur.x, m.vecteur.y, 70 * rage, dt, scene);
        if (m.minuteur <= 0) {
          ennemi.hauteurSaut = 0;
          scene.camera.secouer(3, 0.25);
          scene.audio.jouer('coup');
          scene.particules.emettre(ennemi.centreX, ennemi.y + ennemi.hauteur, {
            nombre: 14, couleurs: ['#8a5ad9', '#c58af2'], vitesse: [40, 120],
          });
          m.phase = 'attente';
          m.minuteur = hasard(0.5, 1) / rage;
        }
        break;
      }

      case 'appel':
        if (m.minuteur <= 0) {
          // Il crache des projectiles tout autour de lui.
          const nombre = 8;
          for (let i = 0; i < nombre; i++) {
            const angle = (i / nombre) * Math.PI * 2;
            scene.ajouter(new Projectile({
              x: ennemi.centreX - 3, y: ennemi.centreY - 3,
              vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80,
              sprite: 'boule_magie', degats: 1, equipe: 'ennemi',
              proprietaire: ennemi, effetImpact: 'magie', rotation: false,
              dureeVie: 2,
            }));
          }
          scene.audio.jouer('tir', 0.5);
          m.phase = 'attente';
          m.minuteur = hasard(0.8, 1.4) / rage;
        }
        break;
      default:
        m.phase = 'attente';
    }
  },
};
