/* =========================================================================
   sauvegarde.js — Garder la partie en memoire dans le navigateur.
   ========================================================================= */

const PREFIXE = 'zeldalike:';

export const Sauvegarde = {
  /** Ecrit des donnees (objet JS) dans un emplacement. */
  ecrire(emplacement, donnees) {
    try {
      localStorage.setItem(PREFIXE + emplacement, JSON.stringify(donnees));
      return true;
    } catch (erreur) {
      console.warn('Sauvegarde impossible :', erreur);
      return false;
    }
  },

  /** Relit des donnees. Retourne `defaut` si rien n'est enregistre. */
  lire(emplacement, defaut = null) {
    try {
      const brut = localStorage.getItem(PREFIXE + emplacement);
      if (!brut) return defaut;
      return JSON.parse(brut);
    } catch (erreur) {
      console.warn('Lecture de sauvegarde impossible :', erreur);
      return defaut;
    }
  },

  existe(emplacement) {
    try {
      return localStorage.getItem(PREFIXE + emplacement) !== null;
    } catch {
      return false;
    }
  },

  effacer(emplacement) {
    try {
      localStorage.removeItem(PREFIXE + emplacement);
    } catch {
      /* rien */
    }
  },
};
