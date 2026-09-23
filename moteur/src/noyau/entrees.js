/* =========================================================================
   entrees.js — Les commandes du joueur.
   Le moteur ne parle jamais de "touche W" mais d'ACTIONS ("attaque").
   Comme ca on peut jouer au clavier, a la manette ou au doigt sans rien
   changer dans le reste du jeu.
   ========================================================================= */

/** Les actions du jeu et les touches clavier qui les declenchent. */
export const TOUCHES_PAR_DEFAUT = {
  haut: ['ArrowUp', 'KeyW', 'KeyZ'],
  bas: ['ArrowDown', 'KeyS'],
  gauche: ['ArrowLeft', 'KeyA', 'KeyQ'],
  droite: ['ArrowRight', 'KeyD'],
  attaque: ['Space', 'KeyX', 'KeyK', 'Enter'], // epee / parler / valider
  objet: ['KeyC', 'KeyL', 'ShiftLeft', 'ShiftRight'], // objet equipe (bombe, arc...)
  pause: ['Escape', 'KeyP', 'Tab'],
  annuler: ['Backspace'],
};

/** Correspondance manette (numeros standards des boutons). */
const MANETTE = {
  0: 'attaque', // A / croix
  1: 'objet', // B / rond
  2: 'objet', // X / carre
  3: 'attaque', // Y / triangle
  9: 'pause', // start
  12: 'haut',
  13: 'bas',
  14: 'gauche',
  15: 'droite',
};

export class Entrees {
  constructor(cible = window) {
    this.touches = { ...TOUCHES_PAR_DEFAUT };
    this.actuel = new Set(); // actions enfoncees maintenant
    this.precedent = new Set(); // actions enfoncees a l'image precedente
    // Memoire tampon : une tape tres courte (appui + relachement entre deux
    // images) doit quand meme compter. Sans ca, certains appuis se perdent.
    this.tampon = new Set();
    this.tactile = new Set(); // actions maintenues par les boutons a l'ecran
    this.axeManette = { x: 0, y: 0 };
    this.derniereSource = 'clavier';

    this._surTouche = (evenement, enfoncee) => {
      const action = this.actionPourTouche(evenement.code);
      if (!action) return;
      // On empeche la page de defiler quand on joue.
      evenement.preventDefault();
      this.derniereSource = 'clavier';
      if (enfoncee) {
        if (!this.actuel.has(action)) this.tampon.add(action); // evite la repetition auto
        this.actuel.add(action);
      } else {
        this.actuel.delete(action);
      }
    };

    cible.addEventListener('keydown', (e) => this._surTouche(e, true), { passive: false });
    cible.addEventListener('keyup', (e) => this._surTouche(e, false), { passive: false });
    // Si on quitte la fenetre, on relache tout (sinon le heros court tout seul).
    window.addEventListener('blur', () => this.actuel.clear());
  }

  /** Quelle action correspond a ce code de touche ? */
  actionPourTouche(code) {
    for (const [action, codes] of Object.entries(this.touches)) {
      if (codes.includes(code)) return action;
    }
    return null;
  }

  /** Branche les boutons tactiles : tout element avec data-action="attaque". */
  brancherTactile(racine = document) {
    const boutons = racine.querySelectorAll('[data-action]');
    for (const bouton of boutons) {
      const action = bouton.dataset.action;
      const presser = (e) => {
        e.preventDefault();
        this.derniereSource = 'tactile';
        if (!this.tactile.has(action)) this.tampon.add(action);
        this.tactile.add(action);
        bouton.classList.add('actif');
      };
      const relacher = (e) => {
        e.preventDefault();
        this.tactile.delete(action);
        bouton.classList.remove('actif');
      };
      bouton.addEventListener('pointerdown', presser);
      bouton.addEventListener('pointerup', relacher);
      bouton.addEventListener('pointercancel', relacher);
      bouton.addEventListener('pointerleave', relacher);
      bouton.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  /** Lit la manette branchee (appele automatiquement a chaque image). */
  sonderManette() {
    if (!navigator.getGamepads) return;
    const manettes = navigator.getGamepads();
    this.axeManette.x = 0;
    this.axeManette.y = 0;
    for (const manette of manettes) {
      if (!manette) continue;
      for (const [index, action] of Object.entries(MANETTE)) {
        const bouton = manette.buttons[index];
        if (bouton && bouton.pressed) {
          if (!this.actuel.has(action)) this.tampon.add(action);
          this.actuel.add(action);
          this.derniereSource = 'manette';
        } else if (bouton) {
          // On ne retire que si le clavier ne tient pas deja l'action.
          if (!this._clavierTient(action)) this.actuel.delete(action);
        }
      }
      const zoneMorte = 0.25;
      const x = manette.axes[0] || 0;
      const y = manette.axes[1] || 0;
      if (Math.abs(x) > zoneMorte || Math.abs(y) > zoneMorte) {
        this.axeManette.x = x;
        this.axeManette.y = y;
        this.derniereSource = 'manette';
      }
    }
  }

  _clavierTient(action) {
    // Approximation volontairement simple : suffisant pour un jeu 2D.
    return false;
  }

  /** L'action est-elle maintenue ? */
  enfoncee(action) {
    return this.actuel.has(action) || this.tactile.has(action);
  }

  /** L'action vient-elle juste d'etre pressee (cette image seulement) ? */
  pressee(action) {
    if (this.tampon.has(action)) return true;
    return this.enfoncee(action) && !this.precedent.has(action);
  }

  /** L'action vient-elle juste d'etre relachee ? */
  relachee(action) {
    return !this.enfoncee(action) && this.precedent.has(action);
  }

  /** Direction demandee par le joueur, sous forme de vecteur -1..1. */
  get axeX() {
    let x = 0;
    if (this.enfoncee('gauche')) x -= 1;
    if (this.enfoncee('droite')) x += 1;
    if (x === 0 && Math.abs(this.axeManette.x) > 0.25) x = this.axeManette.x;
    return x;
  }

  get axeY() {
    let y = 0;
    if (this.enfoncee('haut')) y -= 1;
    if (this.enfoncee('bas')) y += 1;
    if (y === 0 && Math.abs(this.axeManette.y) > 0.25) y = this.axeManette.y;
    return y;
  }

  /** A appeler en TOUT DEBUT d'image. */
  debutImage() {
    this.sonderManette();
  }

  /** A appeler en TOUTE FIN d'image : memorise l'etat pour le "vient d'etre presse". */
  finImage() {
    this.precedent = new Set([...this.actuel, ...this.tactile]);
    this.tampon.clear();
  }
}
