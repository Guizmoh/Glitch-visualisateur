/* =========================================================================
   main3d.js — DEMARRAGE DE LA VERSION 3D.

   Le jeu est le meme que dans index.html : memes salles, memes ennemis,
   memes dialogues. Seul l'affichage change (voir src/rendu3d/).
   ========================================================================= */

import { Moteur } from './noyau/moteur.js';
import { Atlas } from './noyau/pixels.js';
import { SPRITES, PALETTE } from './contenu/sprites.js';
import { construireTuileset } from './monde/tuileset.js';
import { CONFIG } from './contenu/config.js';
import { CARTES } from './contenu/cartes.js';
import { Sauvegarde } from './noyau/sauvegarde.js';
import { Vue3D } from './rendu3d/vue3d.js';
import { SceneTitre } from './scenes/scene-titre.js';
import { SceneJeu3D } from './scenes/scene-jeu-3d.js';
import { SceneCarton } from './scenes/scene-carton.js';

export function demarrer({ canvas3d, canvasHud }) {
  // Les graphismes 2D servent encore : l'interface, et les textures du sol.
  const atlas = new Atlas(PALETTE);
  for (const [nom, motif] of Object.entries(SPRITES)) atlas.ajouterMotif(nom, motif);
  construireTuileset();

  // L'interface est dessinee sur un petit ecran transparent, pose sur la 3D.
  const moteur = new Moteur({
    canvas: canvasHud,
    largeur: 384,
    hauteur: 216,
    ecran: { transparent: true, remplir: true },
  });
  moteur.atlas = atlas;
  moteur.vue3d = new Vue3D(canvas3d);
  moteur.entrees.brancherTactile(document);

  // On remplace la scene de jeu 2D par sa version 3D, partout.
  const lancerPartie = (donnees) => moteur.changerScene(new SceneJeu3D(), donnees);
  moteur.lancerPartie = lancerPartie;

  const parametres = new URLSearchParams(window.location.search);
  const salleDeTest = parametres.get('salle');
  if (salleDeTest === '__test__') {
    const brouillon = Sauvegarde.lire('salle-test');
    if (brouillon) CARTES.__test__ = brouillon;
  }

  if (salleDeTest) {
    moteur.changerScene(new SceneJeu3D({ salle: salleDeTest }));
  } else {
    moteur.changerScene(new SceneTitre());
  }

  moteur.demarrer();
  window.jeu = moteur;
  return moteur;
}
