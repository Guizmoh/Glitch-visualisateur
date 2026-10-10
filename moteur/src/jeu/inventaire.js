/* =========================================================================
   inventaire.js — Le sac du heros : rubis, cles, bombes, objets trouves.
   ========================================================================= */

import { OBJETS } from '../contenu/objets.js';
import { evenements } from '../noyau/evenements.js';

export const MAXIMUMS = {
  rubis: 999,
  cles: 9,
  bombes: 10,
  fleches: 30,
};

export class Inventaire {
  constructor() {
    this.rubis = 0;
    this.cles = 0;
    this.bombes = 0;
    this.fleches = 0;
    this.objets = new Set(); // objets permanents : 'epee', 'arc'...
    this.compteurs = {}; // pour les objets a collectionner (fragments)
    this.equipe = null; // objet utilise avec la touche OBJET
  }

  /** Ajoute une quantite de consommable (rubis, cles, bombes, fleches). */
  ajouter(quoi, combien = 1) {
    if (!(quoi in MAXIMUMS)) return false;
    this[quoi] = Math.min(MAXIMUMS[quoi], this[quoi] + combien);
    evenements.emettre('inventaire-change', { quoi, valeur: this[quoi] });
    return true;
  }

  /** Depense (retourne faux si on n'en a pas assez). */
  depenser(quoi, combien = 1) {
    if (!(quoi in MAXIMUMS)) return false;
    if (this[quoi] < combien) return false;
    this[quoi] -= combien;
    evenements.emettre('inventaire-change', { quoi, valeur: this[quoi] });
    return true;
  }

  /** Donne un objet permanent (epee, arc, palmes...). */
  donner(nomObjet) {
    const def = OBJETS[nomObjet];
    if (!def) return false;
    if (def.compteur) {
      this.compteurs[nomObjet] = (this.compteurs[nomObjet] || 0) + 1;
    }
    this.objets.add(nomObjet);
    if (def.equipable && !this.equipe) this.equipe = nomObjet;
    evenements.emettre('objet-obtenu', { objet: nomObjet, def });
    return true;
  }

  possede(nomObjet) {
    return this.objets.has(nomObjet);
  }

  compteur(nomObjet) {
    return this.compteurs[nomObjet] || 0;
  }

  /** Change l'objet equipe (touche OBJET). */
  equiperSuivant() {
    const equipables = [...this.objets].filter((nom) => OBJETS[nom]?.equipable);
    if (equipables.length === 0) return null;
    const index = equipables.indexOf(this.equipe);
    this.equipe = equipables[(index + 1) % equipables.length];
    evenements.emettre('objet-equipe', { objet: this.equipe });
    return this.equipe;
  }

  /** Munitions restantes pour l'objet equipe (ou null si illimite). */
  munitionsEquipe() {
    const def = OBJETS[this.equipe];
    if (!def || !def.munition) return null;
    return this[def.munition];
  }

  versJSON() {
    return {
      rubis: this.rubis,
      cles: this.cles,
      bombes: this.bombes,
      fleches: this.fleches,
      objets: [...this.objets],
      compteurs: { ...this.compteurs },
      equipe: this.equipe,
    };
  }

  depuisJSON(donnees) {
    if (!donnees) return;
    this.rubis = donnees.rubis || 0;
    this.cles = donnees.cles || 0;
    this.bombes = donnees.bombes || 0;
    this.fleches = donnees.fleches || 0;
    this.objets = new Set(donnees.objets || []);
    this.compteurs = donnees.compteurs || {};
    this.equipe = donnees.equipe || null;
  }
}
