/* =========================================================================
   main.js — LE DEMARRAGE.
   1. On fabrique toutes les images (sprites + tuiles).
   2. On cree le moteur.
   3. On affiche l'ecran-titre.
   ========================================================================= */

import { Moteur } from './noyau/moteur.js';
import { Atlas } from './noyau/pixels.js';
import { SPRITES, PALETTE } from './contenu/sprites.js';
import { construireTuileset } from './monde/tuileset.js';
import { CONFIG } from './contenu/config.js';
import { SceneTitre } from './scenes/scene-titre.js';
import { SceneJeu } from './scenes/scene-jeu.js';
import { CARTES } from './contenu/cartes.js';
import { Sauvegarde } from './noyau/sauvegarde.js';

export function demarrer(canvas) {
  // 1. Les graphismes
  const atlas = new Atlas(PALETTE);
  for (const [nom, motif] of Object.entries(SPRITES)) {
    atlas.ajouterMotif(nom, motif);
  }
  construireTuileset();

  // 2. Le moteur
  const moteur = new Moteur({
    canvas,
    largeur: CONFIG.largeurEcran,
    hauteur: CONFIG.hauteurEcran,
  });
  moteur.atlas = atlas;
  moteur.entrees.brancherTactile(document);

  // 3. La premiere scene.
  // Astuce : ajoute "?salle=donjon-2" a l'adresse pour tester une salle
  // directement (tres pratique pendant la creation du jeu !).
  const parametres = new URLSearchParams(window.location.search);
  const salleDeTest = parametres.get('salle');

  // La salle "__test__" vient de l'editeur de cartes (bouton "Tester").
  if (salleDeTest === '__test__') {
    const brouillon = Sauvegarde.lire('salle-test');
    if (brouillon) CARTES.__test__ = brouillon;
  }
  if (salleDeTest) {
    moteur.changerScene(new SceneJeu({ salle: salleDeTest }));
  } else {
    moteur.changerScene(new SceneTitre());
  }

  moteur.demarrer();
  window.jeu = moteur; // pour bidouiller depuis la console du navigateur
  return moteur;
}
