/* =========================================================================
   formes.js — TOUTES LES FORMES 3D DU JEU.
   Le jeu reste le meme : ce fichier dit seulement "a quoi ressemble, en
   volume, ce qui etait un carre de 16 pixels".

   Unite : 1 case du jeu = 1 unite 3D. Le sol est a y = 0.
   ========================================================================= */

import * as THREE from 'three';
import { matiereToon, matiereTexturee, textureTuile, ajouterContour, contournerGroupe } from './materiaux.js';
import { TUILES } from '../contenu/tuiles.js';
import { ENNEMIS } from '../contenu/ennemis.js';

/* ===================================================================== */
/* LES TUILES QUI PRENNENT DU VOLUME                                     */
/* ===================================================================== */

const geo = {
  cube: new THREE.BoxGeometry(1, 1, 1),
  tronc: new THREE.CylinderGeometry(0.11, 0.17, 0.95, 6),
  houppier: new THREE.IcosahedronGeometry(0.52, 0),
  houppierHaut: new THREE.IcosahedronGeometry(0.34, 0),
  buisson: new THREE.IcosahedronGeometry(0.34, 0),
  rocher: new THREE.DodecahedronGeometry(0.34, 0),
  pot: new THREE.CylinderGeometry(0.22, 0.17, 0.45, 8),
  potCol: new THREE.CylinderGeometry(0.13, 0.19, 0.12, 8),
  barreau: new THREE.BoxGeometry(0.1, 1.3, 0.1),
  cristal: new THREE.OctahedronGeometry(0.33, 0),
  pic: new THREE.ConeGeometry(0.1, 0.35, 4),
  dalle: new THREE.BoxGeometry(0.78, 0.09, 0.78),
  marche: new THREE.BoxGeometry(0.9, 0.16, 0.28),
  flamme: new THREE.ConeGeometry(0.11, 0.3, 6),
  planche: new THREE.BoxGeometry(0.4, 0.09, 0.14),
};

/**
 * Les morceaux 3D a poser sur une case, en plus du sol.
 * Chaque morceau : { geometrie, materiau, position, rotation, echelle, contour }
 * Renvoie null si la case n'a besoin d'aucun volume (herbe, chemin...).
 */
const cacheMorceaux = new Map();

/** Version memoisee : un seul jeu de materiaux par lettre de tuile. */
export function morceauxDeTuile(symbole) {
  if (cacheMorceaux.has(symbole)) return cacheMorceaux.get(symbole);
  const morceaux = construireMorceaux(symbole);
  cacheMorceaux.set(symbole, morceaux);
  return morceaux;
}

function construireMorceaux(symbole) {
  const def = TUILES[symbole];
  if (!def) return null;
  const T = (s) => textureTuile(s);

  switch (symbole) {
    /* --- Les murs : un bloc texture comme en 2D --------------------- */
    case '#': case 'W': case 'M':
      return [{
        geometrie: geo.cube,
        materiau: matiereTexturee(T(symbole), { contour: 0.25 }),
        position: [0, 0.65, 0],
        echelle: [1, 1.3, 1],
        contour: 0.02,
      }];

    /* --- La vegetation ---------------------------------------------- */
    case 'T':
      return [
        { geometrie: geo.tronc, materiau: matiereToon(0x6b4a2e, { contour: 0.2 }), position: [0, 0.47, 0], contour: 0.022 },
        { geometrie: geo.houppier, materiau: matiereToon(0x34702c, { contour: 0.35 }), position: [0, 1.15, 0], echelle: [1.1, 0.8, 1.1], contour: 0.03 },
        { geometrie: geo.houppierHaut, materiau: matiereToon(0x468a30, { contour: 0.4 }), position: [0.1, 1.55, -0.08], contour: 0.026 },
      ];
    case 'o':
      return [{ geometrie: geo.buisson, materiau: matiereToon(0x3f8a2e, { contour: 0.4 }), position: [0, 0.3, 0], echelle: [1.2, 0.95, 1.2], contour: 0.026 }];
    case '%':
      return [{ geometrie: geo.rocher, materiau: matiereToon(0x9a9c9b, { contour: 0.3 }), position: [0, 0.28, 0], contour: 0.026 }];

    /* --- Les objets de donjon ---------------------------------------- */
    case 'p':
      return [
        { geometrie: geo.pot, materiau: matiereToon(0xc08552, { contour: 0.35 }), position: [0, 0.23, 0], contour: 0.02 },
        { geometrie: geo.potCol, materiau: matiereToon(0x8b5a3c, { contour: 0.35 }), position: [0, 0.5, 0], contour: 0.018 },
      ];
    case '^': {
      const pics = [];
      for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
        pics.push({ geometrie: geo.pic, materiau: matiereToon(0xb9bfcb, { contour: 0.5 }), position: [dx, 0.17, dz], contour: 0.015 });
      }
      return pics;
    }
    case 'I':
      return [{ geometrie: geo.dalle, materiau: matiereToon(0x6b6480, { contour: 0.3 }), position: [0, 0.05, 0], contour: 0.016 }];
    case 'c':
      return [{ geometrie: geo.cristal, materiau: matiereToon(0x7ee0e8, { contour: 0.9, transparent: true, opacite: 0.85 }), position: [0, 0.45, 0], contour: 0.02 }];
    case 'V': {
      const barres = [];
      for (const dx of [-0.32, -0.11, 0.11, 0.32]) {
        barres.push({ geometrie: geo.barreau, materiau: matiereToon(0x9aa0b0, { contour: 0.5 }), position: [dx, 0.65, 0], contour: 0.014 });
      }
      return barres;
    }
    case 'D': case 'B':
      return [
        {
          geometrie: geo.cube,
          materiau: matiereTexturee(T(symbole), { contour: 0.3 }),
          position: [0, 0.65, 0], echelle: [1, 1.3, 0.45], contour: 0.022,
        },
      ];
    case 'S':
      return [
        { geometrie: geo.marche, materiau: matiereToon(0x8f8a9c, { contour: 0.3 }), position: [0, 0.08, 0.3], contour: 0.016 },
        { geometrie: geo.marche, materiau: matiereToon(0x7a7588, { contour: 0.3 }), position: [0, 0.22, 0.02], contour: 0.016 },
        { geometrie: geo.marche, materiau: matiereToon(0x666074, { contour: 0.3 }), position: [0, 0.36, -0.26], contour: 0.016 },
      ];
    case '!':
      return [
        { geometrie: geo.cube, materiau: matiereTexturee(T('W'), { contour: 0.25 }), position: [0, 0.65, 0], echelle: [1, 1.3, 1], contour: 0.02 },
        { geometrie: geo.flamme, materiau: matiereToon(0xffb347, { contour: 1.2 }), position: [0, 1.15, 0.5], contour: 0 },
      ];

    /* --- L'interieur de la maison ------------------------------------ */
    case '&': {
      const debris = [];
      for (let i = 0; i < 4; i++) {
        debris.push({
          geometrie: geo.planche,
          materiau: matiereToon(i % 2 ? 0x6e4527 : 0x8b5a3c, { contour: 0.35 }),
          position: [(i % 2 ? 0.14 : -0.16), 0.06 + i * 0.05, (i < 2 ? 0.12 : -0.14)],
          rotation: [0, i * 1.1, i * 0.12],
          contour: 0.014,
        });
      }
      return debris;
    }
    case 'i':
      return [
        { geometrie: geo.cube, materiau: matiereToon(0x8b5a3c, { contour: 0.25 }), position: [0, 0.16, 0], echelle: [0.92, 0.3, 0.92], contour: 0.018 },
        { geometrie: geo.cube, materiau: matiereToon(0xd94a4a, { contour: 0.3 }), position: [0, 0.33, -0.06], echelle: [0.84, 0.1, 0.78], contour: 0.014 },
        { geometrie: geo.cube, materiau: matiereToon(0xf4f1de, { contour: 0.35 }), position: [0, 0.36, 0.3], echelle: [0.7, 0.12, 0.26], contour: 0.014 },
      ];
    case 'z':
      return [
        { geometrie: geo.cube, materiau: matiereToon(0xa9763f, { contour: 0.3 }), position: [0, 0.3, 0], echelle: [0.8, 0.1, 0.62], rotation: [0.5, 0.3, 0.2], contour: 0.016 },
        { geometrie: geo.cube, materiau: matiereToon(0x8b5a3c, { contour: 0.3 }), position: [-0.2, 0.1, 0.18], echelle: [0.08, 0.4, 0.08], rotation: [0.5, 0.3, 0.2], contour: 0.012 },
        { geometrie: geo.cube, materiau: matiereToon(0x8b5a3c, { contour: 0.3 }), position: [0.22, 0.12, -0.1], echelle: [0.08, 0.4, 0.08], rotation: [0.5, 0.3, 0.2], contour: 0.012 },
      ];

    default:
      return null;
  }
}

/** Les cases qui creusent le sol au lieu de le surelever. */
export function creuxDeTuile(symbole) {
  if (symbole === 'x') return { profondeur: 1.6, couleur: 0x08070d };
  if (symbole === '~') return { profondeur: 0.22, couleur: 0x2f6fb5, eau: true };
  if (symbole === 'L') return { profondeur: 0.16, couleur: 0xd1400f, eau: true };
  return null;
}

/* ===================================================================== */
/* LES PERSONNAGES                                                       */
/* ===================================================================== */

/**
 * Un personnage debout, haut d'environ 1 case.
 * On garde des formes simples : c'est le contour a l'encre et l'ombrage
 * en aplats qui font tout le travail.
 */
export function creerPersonnage({
  haut = 0x9a6b43, pantalon = 0xc9b184, cheveux = 0x5a3a22,
  peau = 0xf3c6a0, yeux = 0x3f9e52, taille = 1,
} = {}) {
  const g = new THREE.Group();
  const matHaut = matiereToon(haut, { contour: 0.55 });
  const matPeau = matiereToon(peau, { contour: 0.5 });
  const matBas = matiereToon(pantalon, { contour: 0.4 });

  const jambeG = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.2, 3, 6), matBas);
  jambeG.position.set(-0.075, 0.17, 0);
  const jambeD = jambeG.clone();
  jambeD.position.x = 0.075;

  const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.4, 10), matHaut);
  corps.position.y = 0.5;

  const ceinture = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10), matiereToon(0x6e4527, { contour: 0.3 }));
  ceinture.position.y = 0.33;

  const brasG = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 3, 6), matPeau);
  brasG.position.set(-0.2, 0.5, 0);
  brasG.rotation.z = 0.22;
  const brasD = brasG.clone();
  brasD.position.x = 0.2;
  brasD.rotation.z = -0.22;

  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), matPeau);
  tete.position.y = 0.83;

  const chevelure = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10), matiereToon(cheveux, { contour: 0.6 }));
  chevelure.position.set(0, 0.86, -0.02);
  chevelure.scale.set(1, 0.82, 0.92);

  g.add(jambeG, jambeD, corps, ceinture, brasG, brasD, chevelure, tete);

  const matOeil = new THREE.MeshBasicMaterial({ color: yeux });
  for (const cote of [-1, 1]) {
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 6), matOeil);
    oeil.position.set(0.055 * cote, 0.845, 0.135);
    oeil.userData.sansContour = true;
    g.add(oeil);
    const oreille = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 4), matPeau);
    oreille.position.set(0.15 * cote, 0.85, 0.01);
    oreille.rotation.z = -0.9 * cote;
    g.add(oreille);
  }

  g.scale.setScalar(taille);
  contournerGroupe(g, 0.016);
  g.userData.membres = { jambeG, jambeD, brasG, brasD, tete };
  return g;
}

/* ===================================================================== */
/* LES MONSTRES                                                          */
/* ===================================================================== */

export function creerMonstre(espece) {
  const fiche = ENNEMIS[espece] || {};
  const base = fiche.sprite || espece;
  const g = new THREE.Group();
  const teinte = fiche.teinte ? new THREE.Color(fiche.teinte).getHex() : null;

  if (base === 'gluant' || base === 'roi_gluant') {
    const roi = base === 'roi_gluant';
    const couleur = teinte || (roi ? 0x8a5ad9 : 0x57c96a);
    const corps = new THREE.Mesh(new THREE.SphereGeometry(roi ? 0.75 : 0.34, 12, 10), matiereToon(couleur, { contour: 0.55 }));
    corps.scale.y = 0.78;
    corps.position.y = roi ? 0.56 : 0.26;
    g.add(corps);
    const matOeil = new THREE.MeshBasicMaterial({ color: 0x14121c });
    for (const cote of [-1, 1]) {
      const oeil = new THREE.Mesh(new THREE.SphereGeometry(roi ? 0.1 : 0.05, 8, 6), matOeil);
      oeil.position.set((roi ? 0.26 : 0.12) * cote, roi ? 0.68 : 0.32, roi ? 0.6 : 0.28);
      oeil.userData.sansContour = true;
      g.add(oeil);
    }
    if (roi) {
      const couronne = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.22, 8), matiereToon(0xe0b34a, { contour: 0.9 }));
      couronne.position.y = 1.18;
      g.add(couronne);
      for (let i = 0; i < 6; i++) {
        const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), matiereToon(0xe0b34a, { contour: 0.9 }));
        const a = (i / 6) * Math.PI * 2;
        pointe.position.set(Math.cos(a) * 0.44, 1.36, Math.sin(a) * 0.44);
        g.add(pointe);
      }
    }
    g.userData.rebondir = true;
  } else if (base === 'chauve_souris') {
    const corps = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), matiereToon(teinte || 0x8a5ad9, { contour: 0.6 }));
    corps.position.y = 0.55;
    const aileG = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.2), matiereToon(0x6e45b5, { contour: 0.5 }));
    aileG.position.set(-0.24, 0.57, 0);
    const aileD = aileG.clone();
    aileD.position.x = 0.24;
    g.add(corps, aileG, aileD);
    const matOeil = new THREE.MeshBasicMaterial({ color: 0xe04a4a });
    for (const cote of [-1, 1]) {
      const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), matOeil);
      oeil.position.set(0.06 * cote, 0.58, 0.14);
      oeil.userData.sansContour = true;
      g.add(oeil);
    }
    g.userData.ailes = [aileG, aileD];
  } else {
    // Squelette : os blancs, crane un peu trop gros.
    const couleur = teinte || 0xe8e4d4;
    const mat = matiereToon(couleur, { contour: 0.6 });
    const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.36, 8), mat);
    corps.position.y = 0.42;
    const crane = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mat);
    crane.position.y = 0.76;
    const jambeG = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 3, 6), mat);
    jambeG.position.set(-0.08, 0.15, 0);
    const jambeD = jambeG.clone();
    jambeD.position.x = 0.08;
    const brasG = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.16, 3, 6), mat);
    brasG.position.set(-0.19, 0.44, 0);
    const brasD = brasG.clone();
    brasD.position.x = 0.19;
    g.add(corps, crane, jambeG, jambeD, brasG, brasD);
    const matOeil = new THREE.MeshBasicMaterial({ color: 0x14121c });
    for (const cote of [-1, 1]) {
      const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), matOeil);
      oeil.position.set(0.06 * cote, 0.78, 0.14);
      oeil.userData.sansContour = true;
      g.add(oeil);
    }
    g.userData.membres = { jambeG, jambeD, brasG, brasD };
  }

  contournerGroupe(g, 0.018);
  if (fiche.echelle) g.scale.setScalar(fiche.echelle > 1.5 ? 1 : fiche.echelle);
  return g;
}

/* ===================================================================== */
/* LES OBJETS DU DECOR                                                   */
/* ===================================================================== */

export function creerCoffre() {
  const g = new THREE.Group();
  const caisse = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), matiereToon(0x7a5433, { contour: 0.4 }));
  caisse.position.y = 0.2;
  const couvercle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.72, 10, 1, false, 0, Math.PI),
    matiereToon(0x8f6540, { contour: 0.5 })
  );
  couvercle.rotation.z = Math.PI / 2;
  couvercle.position.y = 0.4;
  const ferrure = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.05), matiereToon(0xe0b34a, { contour: 0.9 }));
  ferrure.position.set(0, 0.34, 0.26);
  g.add(caisse, couvercle, ferrure);
  contournerGroupe(g, 0.018);
  g.userData.couvercle = couvercle;
  return g;
}

export function creerPanneau() {
  const g = new THREE.Group();
  const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), matiereToon(0x8b5a3c, { contour: 0.3 }));
  poteau.position.y = 0.25;
  const planche = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.06), matiereToon(0xc08552, { contour: 0.45 }));
  planche.position.y = 0.6;
  g.add(poteau, planche);
  contournerGroupe(g, 0.016);
  return g;
}

export function creerBloc() {
  const g = new THREE.Group();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.96, 0.96), matiereTexturee(textureTuile('#'), { contour: 0.3 }));
  cube.position.y = 0.48;
  g.add(cube);
  contournerGroupe(g, 0.02);
  return g;
}

/** Les objets a ramasser : une forme simple qui tourne et flotte. */
const FORMES_OBJETS = {
  coeur: { couleur: 0xe04a4a, forme: () => new THREE.SphereGeometry(0.13, 8, 6), echelle: [1, 0.9, 0.7] },
  demi_coeur: { couleur: 0xe04a4a, forme: () => new THREE.SphereGeometry(0.1, 8, 6) },
  rubis: { couleur: 0x57c96a, forme: () => new THREE.OctahedronGeometry(0.15, 0) },
  rubis_bleu: { couleur: 0x4a90d9, forme: () => new THREE.OctahedronGeometry(0.16, 0) },
  rubis_rouge: { couleur: 0xe04a4a, forme: () => new THREE.OctahedronGeometry(0.17, 0) },
  cle: { couleur: 0xf2c14b, forme: () => new THREE.TorusGeometry(0.08, 0.03, 6, 10) },
  cle_boss: { couleur: 0x8a5ad9, forme: () => new THREE.TorusGeometry(0.1, 0.04, 6, 10) },
  munition_bombe: { couleur: 0x3a3a48, forme: () => new THREE.SphereGeometry(0.13, 8, 6) },
  bombes: { couleur: 0x3a3a48, forme: () => new THREE.SphereGeometry(0.15, 8, 6) },
  munition_fleche: { couleur: 0x9aa0b0, forme: () => new THREE.ConeGeometry(0.07, 0.3, 5) },
  potion: { couleur: 0xe04a4a, forme: () => new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8) },
  epee: { couleur: 0xdde3ee, forme: () => new THREE.BoxGeometry(0.07, 0.42, 0.02) },
  bouclier: { couleur: 0x3f63b5, forme: () => new THREE.CylinderGeometry(0.16, 0.1, 0.05, 6) },
  arc: { couleur: 0x8b5a3c, forme: () => new THREE.TorusGeometry(0.14, 0.025, 6, 10, Math.PI * 1.4) },
  palmes: { couleur: 0x4ad9c9, forme: () => new THREE.ConeGeometry(0.13, 0.26, 5) },
  coeur_max: { couleur: 0xe04a4a, forme: () => new THREE.SphereGeometry(0.19, 10, 8), echelle: [1, 0.9, 0.7] },
  fragment: { couleur: 0xfff0a0, forme: () => new THREE.OctahedronGeometry(0.2, 0) },
};

export function creerRamassable(nomObjet) {
  const def = FORMES_OBJETS[nomObjet] || { couleur: 0xf2c14b, forme: () => new THREE.OctahedronGeometry(0.14, 0) };
  const g = new THREE.Group();
  const maille = new THREE.Mesh(def.forme(), matiereToon(def.couleur, { contour: 1.1 }));
  if (def.echelle) maille.scale.set(...def.echelle);
  maille.position.y = 0.3;
  g.add(maille);
  contournerGroupe(g, 0.014);
  g.userData.tourne = maille;
  return g;
}

export function creerProjectile(sprite) {
  const couleur = sprite === 'fleche' ? 0xc9c2b0 : 0xc58af2;
  const geometrie = sprite === 'fleche'
    ? new THREE.ConeGeometry(0.05, 0.3, 5)
    : new THREE.SphereGeometry(0.12, 8, 6);
  const maille = new THREE.Mesh(geometrie, matiereToon(couleur, { contour: 1.4 }));
  maille.position.y = 0.4;
  const g = new THREE.Group();
  g.add(maille);
  return g;
}

/** L'arc du coup d'epee : une lame qui balaie devant le heros. */
export function creerLameEpee() {
  // Un arc fin qui balaie devant le heros : on doit lire le geste sans que
  // ca mange tout l'ecran.
  const forme = new THREE.RingGeometry(0.34, 0.6, 14, 1, 0, Math.PI * 0.6);
  const maille = new THREE.Mesh(forme, new THREE.MeshBasicMaterial({
    color: 0xdff3ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
  }));
  maille.rotation.x = -Math.PI / 2;
  maille.position.y = 0.4;
  maille.visible = false;
  maille.userData.sansContour = true;
  return maille;
}
