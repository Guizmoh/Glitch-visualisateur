/* =========================================================================
   scene-titre.js — L'ecran d'accueil.
   ========================================================================= */

import { Scene } from '../noyau/scene.js';
import { texte, rect, boite } from '../noyau/rendu.js';
import { Sauvegarde } from '../noyau/sauvegarde.js';
import { SystemeParticules } from '../noyau/particules.js';
import { CONFIG } from '../contenu/config.js';
import { MUSIQUES } from '../contenu/musiques.js';
import { SceneJeu } from './scene-jeu.js';

export class SceneTitre extends Scene {
  constructor() {
    super('titre');
    this.temps = 0;
    this.choix = 0;
  }

  entrer() {
    this.particules = new SystemeParticules();
    this.aUneSauvegarde = Sauvegarde.existe('partie');
    this.options = this.aUneSauvegarde
      ? ['Continuer', 'Nouvelle partie']
      : ['Commencer l\'aventure'];
    this.choix = 0;
    if (MUSIQUES.titre) {
      this.moteur.audio.jouerMusique(MUSIQUES.titre.notes, MUSIQUES.titre.options);
    }
  }

  sortir() {
    this.moteur.audio.arreterMusique();
  }

  maj(dt) {
    this.temps += dt;
    this.particules.maj(dt);

    // Petites etoiles qui montent en fond.
    if (Math.random() < dt * 14) {
      this.particules.emettre(Math.random() * this.ecran.largeur, this.ecran.hauteur + 4, {
        nombre: 1, couleurs: ['#f2c14b', '#7ee0e8', '#ffffff'],
        vitesse: [8, 20], duree: [2, 3.5], direction: -Math.PI / 2, ouverture: 0.4,
      });
    }

    if (this.options.length > 1) {
      if (this.entrees.pressee('bas')) {
        this.choix = (this.choix + 1) % this.options.length;
        this.moteur.audio.jouer('menu');
      }
      if (this.entrees.pressee('haut')) {
        this.choix = (this.choix - 1 + this.options.length) % this.options.length;
        this.moteur.audio.jouer('menu');
      }
    }

    if (this.entrees.pressee('attaque') || this.entrees.pressee('objet')) {
      this.moteur.audio.reveiller();
      this.moteur.audio.jouer('secret');
      const continuer = this.aUneSauvegarde && this.choix === 0;
      // lancerPartie est fourni par la page : version 2D ou version 3D.
      const lancer = this.moteur.lancerPartie
        || ((donnees) => this.moteur.changerScene(new SceneJeu(), donnees));
      if (continuer) {
        lancer({ charger: true });
      } else {
        // Nouvelle partie : on raconte d'abord ce qui s'est passe cette nuit-la.
        Sauvegarde.effacer('partie');
        import('./scene-carton.js').then(({ SceneCarton }) => {
          this.moteur.changerScene(new SceneCarton());
        });
      }
    }
  }

  dessiner(ctx) {
    const L = this.ecran.largeur;
    const H = this.ecran.hauteur;

    // Ciel degrade
    for (let y = 0; y < H; y++) {
      const melange = y / H;
      const r = Math.round(12 + melange * 30);
      const v = Math.round(10 + melange * 20);
      const b = Math.round(30 + melange * 40);
      rect(ctx, 0, y, L, 1, `rgb(${r},${v},${b})`);
    }
    this.particules.dessiner(ctx);

    // Collines
    ctx.fillStyle = '#1d3b2a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= L; x += 8) {
      ctx.lineTo(x, H - 30 - Math.sin(x / 40) * 10);
    }
    ctx.lineTo(L, H);
    ctx.closePath();
    ctx.fill();

    // Titre
    const flottement = Math.sin(this.temps * 2) * 2;
    texte(ctx, CONFIG.titre.toUpperCase(), L / 2, 34 + flottement, {
      taille: 16, alignement: 'center', couleur: '#f2c14b', ombre: '#2a1f0a',
    });
    texte(ctx, CONFIG.sousTitre, L / 2, 56 + flottement, {
      taille: 8, alignement: 'center', couleur: '#a8aec0',
    });

    // Le heros qui attend
    const heros = this.moteur.atlas.image('heros_bas_0');
    if (heros) ctx.drawImage(heros, Math.round(L / 2 - 8), Math.round(H - 52), 16, 16);

    // Menu
    const baseY = 92;
    for (let i = 0; i < this.options.length; i++) {
      const selectionne = i === this.choix;
      const y = baseY + i * 14;
      if (selectionne) {
        boite(ctx, L / 2 - 62, y - 3, 124, 13, { fond: '#241d3a' });
      }
      texte(ctx, this.options[i], L / 2, y, {
        taille: 8, alignement: 'center',
        couleur: selectionne ? '#f4f1de' : '#6f6a85',
      });
    }

    if (Math.floor(this.temps * 2) % 2 === 0) {
      texte(ctx, 'ESPACE pour valider', L / 2, H - 16, {
        taille: 7, alignement: 'center', couleur: '#7ee0e8',
      });
    }
  }
}
