/* =========================================================================
   evenements.js — Le "telephone" du moteur.
   Un morceau de code annonce quelque chose ("le joueur a pris une cle !")
   et tous les autres peuvent ecouter sans se connaitre entre eux.
   ========================================================================= */

export class BusEvenements {
  constructor() {
    this.ecouteurs = new Map();
  }

  /** Ecouter un evenement. Retourne une fonction pour arreter d'ecouter. */
  sur(nom, fonction) {
    if (!this.ecouteurs.has(nom)) this.ecouteurs.set(nom, new Set());
    this.ecouteurs.get(nom).add(fonction);
    return () => this.stop(nom, fonction);
  }

  /** Ecouter une seule fois. */
  uneFois(nom, fonction) {
    const arret = this.sur(nom, (donnees) => {
      arret();
      fonction(donnees);
    });
    return arret;
  }

  /** Arreter d'ecouter. */
  stop(nom, fonction) {
    const liste = this.ecouteurs.get(nom);
    if (liste) liste.delete(fonction);
  }

  /** Annoncer un evenement a tout le monde. */
  emettre(nom, donnees) {
    const liste = this.ecouteurs.get(nom);
    if (!liste) return;
    // On copie la liste : un ecouteur pourrait se desinscrire pendant l'appel.
    for (const fonction of [...liste]) {
      try {
        fonction(donnees);
      } catch (erreur) {
        console.error(`Erreur dans l'ecouteur "${nom}" :`, erreur);
      }
    }
  }

  /** Tout effacer (utilisé quand on recommence une partie). */
  vider() {
    this.ecouteurs.clear();
  }
}

/** Un bus partagé par tout le jeu : `import { evenements } from '...'` */
export const evenements = new BusEvenements();
