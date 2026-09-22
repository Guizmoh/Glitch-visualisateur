/* =========================================================================
   moteur.js — Le coeur du moteur : la BOUCLE DE JEU.
   60 fois par seconde il fait la meme chose :
     1. lire les commandes   2. mettre a jour   3. dessiner
   ========================================================================= */

import { Ecran } from './rendu.js';
import { Entrees } from './entrees.js';
import { audio } from './audio.js';
import { evenements } from './evenements.js';

export class Moteur {
  constructor({ canvas, largeur = 320, hauteur = 192 }) {
    this.ecran = new Ecran(canvas, largeur, hauteur);
    this.entrees = new Entrees(window);
    this.audio = audio;
    this.evenements = evenements;
    this.scenes = []; // pile de scenes
    this.enMarche = false;
    this.dernierTemps = 0;
    this.tempsTotal = 0;
    this.images = 0;
    this.fps = 60;
    this._compteurFps = 0;
    this._horlogeFps = 0;
    this.ralenti = 1; // 1 = normal, 0.3 = ralenti, 0 = fige

    // Le son ne peut demarrer qu'apres une action du joueur.
    const reveil = () => this.audio.reveiller();
    window.addEventListener('keydown', reveil, { once: true });
    window.addEventListener('pointerdown', reveil, { once: true });
  }

  /** La scene tout en haut de la pile. */
  get sceneActive() {
    return this.scenes[this.scenes.length - 1] || null;
  }

  /** Remplace toutes les scenes par une nouvelle. */
  changerScene(scene, donnees = {}) {
    while (this.scenes.length) this.depiler();
    this.empiler(scene, donnees);
  }

  /** Ajoute une scene par-dessus (menu de pause, inventaire...). */
  empiler(scene, donnees = {}) {
    scene.moteur = this;
    this.scenes.push(scene);
    scene.entrer(donnees);
    return scene;
  }

  /** Retire la scene du dessus. */
  depiler() {
    const scene = this.scenes.pop();
    if (scene) scene.sortir();
    return scene;
  }

  demarrer() {
    if (this.enMarche) return;
    this.enMarche = true;
    this.dernierTemps = performance.now();
    requestAnimationFrame((t) => this._boucle(t));
  }

  arreter() {
    this.enMarche = false;
  }

  _boucle(maintenant) {
    if (!this.enMarche) return;
    requestAnimationFrame((t) => this._boucle(t));

    // dt = temps ecoule depuis la derniere image, en secondes.
    // On le limite : si l'onglet est reste en arriere-plan, on ne veut pas
    // que le heros traverse tout le niveau d'un coup.
    let dt = (maintenant - this.dernierTemps) / 1000;
    this.dernierTemps = maintenant;
    if (dt > 0.05) dt = 0.05;
    dt *= this.ralenti;

    this.tempsTotal += dt;
    this.images++;
    this._compteurFps++;
    this._horlogeFps += dt;
    if (this._horlogeFps >= 1) {
      this.fps = this._compteurFps;
      this._compteurFps = 0;
      this._horlogeFps = 0;
    }

    this.entrees.debutImage();

    // 1. Mise a jour : la scene du dessus, et celles qui l'autorisent.
    for (let i = this.scenes.length - 1; i >= 0; i--) {
      const scene = this.scenes[i];
      scene.maj(dt);
      if (!scene.laisseTournerDessous) break;
    }

    // 2. Dessin : de la plus basse a la plus haute.
    const ctx = this.ecran.ctx;
    let premiereADessiner = this.scenes.length - 1;
    while (premiereADessiner > 0 && this.scenes[premiereADessiner].transparente) {
      premiereADessiner--;
    }
    this.ecran.effacer('#0b0a12');
    for (let i = premiereADessiner; i < this.scenes.length; i++) {
      this.scenes[i].dessiner(ctx);
    }

    this.entrees.finImage();
  }
}
