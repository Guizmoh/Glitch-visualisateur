/* =========================================================================
   tuileset.js — Fabrique les images de toutes les tuiles au demarrage.
   Chaque tuile a 3 petites variantes pour que le sol ne soit pas repetitif.
   ========================================================================= */

import { fabriquerTuile, dessinerMotif, creerCanvas } from '../noyau/pixels.js';
import { TUILES, TUILE_DEFAUT, MOTIFS_TUILES } from '../contenu/tuiles.js';
import { PALETTE } from '../contenu/sprites.js';

export const TAILLE_TUILE = 16;
export const NB_VARIANTES = 3;

/** symbole -> { def, variantes:[canvas], motif:canvas|null } */
export const TUILESET = new Map();

let construit = false;

export function construireTuileset() {
  if (construit) return TUILESET;
  for (const [symbole, def] of Object.entries(TUILES)) {
    const variantes = [];
    for (let v = 0; v < NB_VARIANTES; v++) {
      const fond = fabriquerTuile(def, TAILLE_TUILE, symbole.charCodeAt(0) + v * 17);
      // Le motif (arbre, pot...) est colle par-dessus la texture,
      // sauf s'il doit etre dessine au-dessus du heros.
      if (def.motif && MOTIFS_TUILES[def.motif] && !def.dessusJoueur) {
        dessinerMotif(fond.getContext('2d'), MOTIFS_TUILES[def.motif], PALETTE);
      }
      variantes.push(fond);
    }
    let motifSeul = null;
    if (def.motif && MOTIFS_TUILES[def.motif] && def.dessusJoueur) {
      const { canvas, ctx } = creerCanvas(TAILLE_TUILE, TAILLE_TUILE);
      dessinerMotif(ctx, MOTIFS_TUILES[def.motif], PALETTE);
      motifSeul = canvas;
    }
    TUILESET.set(symbole, { def, variantes, motif: motifSeul });
  }
  construit = true;
  return TUILESET;
}

/** Definition d'une tuile a partir de sa lettre. */
export function definitionTuile(symbole) {
  const entree = TUILESET.get(symbole);
  return entree ? entree.def : TUILE_DEFAUT;
}

/** Image a afficher pour cette lettre a cette position. */
export function imageTuile(symbole, col, ligne) {
  const entree = TUILESET.get(symbole);
  if (!entree) return null;
  const index = (col * 7 + ligne * 13) % entree.variantes.length;
  return entree.variantes[index];
}

export function motifDessus(symbole) {
  const entree = TUILESET.get(symbole);
  return entree ? entree.motif : null;
}
