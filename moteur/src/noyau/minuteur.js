/* =========================================================================
   minuteur.js — Compte a rebours et rythmes.
   Sert pour les temps de recharge (attaque), les clignotements, les vagues
   d'ennemis, l'attente avant qu'une porte se ferme, etc.
   ========================================================================= */

/** Un compte a rebours simple : on le remplit, il se vide tout seul. */
export class Minuteur {
  constructor(duree = 0) {
    this.duree = duree;
    this.restant = 0;
  }

  /** Demarre (ou redemarre) le minuteur. */
  lancer(duree = this.duree) {
    this.duree = duree;
    this.restant = duree;
    return this;
  }

  /** A appeler a chaque image. Retourne vrai a l'instant precis ou il se termine. */
  maj(dt) {
    if (this.restant <= 0) return false;
    this.restant -= dt;
    if (this.restant <= 0) {
      this.restant = 0;
      return true;
    }
    return false;
  }

  get enCours() {
    return this.restant > 0;
  }

  get fini() {
    return this.restant <= 0;
  }

  /** De 0 (debut) a 1 (fin). Pratique pour les animations. */
  get progression() {
    if (this.duree <= 0) return 1;
    return 1 - this.restant / this.duree;
  }

  arreter() {
    this.restant = 0;
  }
}

/** Repete une action toutes les X secondes (tir d'ennemi, apparition...). */
export class Metronome {
  constructor(intervalle, action = null) {
    this.intervalle = intervalle;
    this.action = action;
    this.accumule = 0;
  }

  maj(dt) {
    this.accumule += dt;
    let declenche = 0;
    while (this.accumule >= this.intervalle) {
      this.accumule -= this.intervalle;
      declenche++;
      if (this.action) this.action();
    }
    return declenche;
  }

  remettreAZero() {
    this.accumule = 0;
  }
}

/** Execute une fonction apres un delai, gere par la scene (pas par setTimeout). */
export class ListeAttentes {
  constructor() {
    this.taches = [];
  }

  apres(delai, action) {
    const tache = { restant: delai, action, annule: false };
    this.taches.push(tache);
    return () => {
      tache.annule = true;
    };
  }

  maj(dt) {
    for (let i = this.taches.length - 1; i >= 0; i--) {
      const tache = this.taches[i];
      if (tache.annule) {
        this.taches.splice(i, 1);
        continue;
      }
      tache.restant -= dt;
      if (tache.restant <= 0) {
        this.taches.splice(i, 1);
        tache.action();
      }
    }
  }

  vider() {
    this.taches.length = 0;
  }
}
