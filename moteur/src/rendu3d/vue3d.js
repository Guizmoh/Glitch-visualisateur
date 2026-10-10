/* =========================================================================
   vue3d.js — LA VUE 3D DU JEU.

   Point important : le JEU ne change pas. Les salles, les ennemis, les
   coffres, les collisions restent exactement ceux du moteur 2D — ils vivent
   toujours dans un monde plat en pixels. Ce fichier se contente de REGARDER
   ce monde et de le redessiner en volume.

   Conversion : 16 pixels du jeu = 1 unite 3D = 1 case.
   L'axe Y du jeu (vers le bas de l'ecran) devient l'axe Z (vers nous).
   ========================================================================= */

import * as THREE from 'three';
import { TAILLE_TUILE } from '../monde/tuileset.js';
import { TUILES } from '../contenu/tuiles.js';
import { matiereToon, ajouterContour, RAMPE_TONS } from './materiaux.js';
import { Ambiance, DIRECTION_SOLEIL } from './ambiance.js';
import {
  morceauxDeTuile, creuxDeTuile, creerPersonnage, creerMonstre, creerCoffre,
  creerPanneau, creerBloc, creerRamassable, creerProjectile, creerLameEpee,
} from './formes.js';

/** Du monde du jeu (pixels) vers le monde 3D (cases). */
const U = 1 / TAILLE_TUILE;

export class Vue3D {
  constructor(canvas) {
    this.rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.rendu.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.rendu.shadowMap.enabled = true;
    this.rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    this.rendu.toneMapping = THREE.ACESFilmicToneMapping;
    this.rendu.toneMappingExposure = 1.05;
    this.rendu.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 200);

    /* --- Lumieres : un soleil chaud et un ciel froid ------------------ */
    this.lumiereAmbiante = new THREE.HemisphereLight(0xcfe8ff, 0x4a4a55, 1.0);
    this.scene.add(this.lumiereAmbiante);

    this.soleil = new THREE.DirectionalLight(0xffe9c0, 2.6);
    this.soleil.position.copy(DIRECTION_SOLEIL).multiplyScalar(30);
    this.soleil.castShadow = true;
    this.soleil.shadow.mapSize.set(2048, 2048);
    this.soleil.shadow.bias = -0.0012;
    this.soleil.shadow.normalBias = 0.03;
    const boite = this.soleil.shadow.camera;
    boite.left = -16; boite.right = 16; boite.top = 16; boite.bottom = -16;
    boite.near = 1; boite.far = 60;
    boite.updateProjectionMatrix();
    this.scene.add(this.soleil, this.soleil.target);

    /* --- Les groupes : le decor d'un cote, ce qui bouge de l'autre ---- */
    this.decor = new THREE.Group();
    this.groupeEntites = new THREE.Group();
    this.scene.add(this.decor, this.groupeEntites);

    // Le ciel, l'herbe et le paysage lointain.
    this.ambiance = new Ambiance(this.scene, this.rendu);

    this.entites = new Map();   // id d'entite -> objet 3D
    this.carte = null;
    this.versionCarte = -1;
    this.temps = 0;
    this.cibleCamera = new THREE.Vector3();
    this.positionCamera = new THREE.Vector3();
    this.premierCadrage = true;

    this.redimensionner();
    addEventListener('resize', () => this.redimensionner());
  }

  redimensionner() {
    const l = innerWidth;
    const h = innerHeight;
    this.rendu.setSize(l, h, false);
    this.camera.aspect = l / h;
    this.camera.updateProjectionMatrix();
  }

  /* =================================================================== */
  /* LE DECOR : reconstruit a chaque changement de salle                 */
  /* =================================================================== */

  construireSalle(carte) {
    this.carte = carte;
    this.versionCarte = carte.version;
    this._viderDecor();

    const L = carte.largeur;
    const H = carte.hauteur;
    const interieur = !!(carte.donnees.decor[0] || '').match(/^[WM#]/);

    /* --- Le sol : l'image du jeu 2D, plaquee telle quelle ------------- */
    const texture = new THREE.CanvasTexture(carte.imageSol());
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.rendu.capabilities.getMaxAnisotropy();
    const sol = new THREE.Mesh(
      new THREE.PlaneGeometry(L, H),
      new THREE.MeshToonMaterial({ map: texture, gradientMap: RAMPE_TONS })
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.set(L / 2, 0, H / 2);
    sol.receiveShadow = true;
    this.decor.add(sol);
    this.textureSol = texture;

    /* --- Dedans : du noir autour. Dehors : c'est Ambiance qui s'en charge. */
    if (interieur) {
      const alentour = new THREE.Mesh(
        new THREE.PlaneGeometry(220, 220),
        new THREE.MeshBasicMaterial({ color: 0x07060b })
      );
      alentour.rotation.x = -Math.PI / 2;
      alentour.position.set(L / 2, -0.35, H / 2);
      this.decor.add(alentour);
    }
    this.ambiance.configurer(carte, interieur);

    /* --- Les creux : eau, lave, trous --------------------------------- */
    const creux = new Map();
    for (let ligne = 0; ligne < H; ligne++) {
      for (let col = 0; col < L; col++) {
        const symbole = carte.symbole(col, ligne);
        const trou = creuxDeTuile(symbole);
        if (!trou) continue;
        if (!creux.has(symbole)) creux.set(symbole, { trou, cases: [] });
        creux.get(symbole).cases.push([col, ligne]);
      }
    }
    for (const [, { trou, cases }] of creux) {
      const materiau = matiereToon(trou.couleur, { contour: trou.eau ? 0.5 : 0 });
      const maille = new THREE.InstancedMesh(new THREE.BoxGeometry(1, trou.profondeur, 1), materiau, cases.length);
      const m = new THREE.Matrix4();
      cases.forEach(([col, ligne], i) => {
        m.makeTranslation(col + 0.5, -trou.profondeur / 2 - 0.02, ligne + 0.5);
        maille.setMatrixAt(i, m);
      });
      maille.receiveShadow = true;
      this.decor.add(maille);
    }

    /* --- Les volumes : murs, arbres, rochers, meubles... -------------- */
    const groupes = new Map();
    for (let ligne = 0; ligne < H; ligne++) {
      for (let col = 0; col < L; col++) {
        const symbole = carte.symbole(col, ligne);
        const morceaux = morceauxDeTuile(symbole);
        if (!morceaux) continue;
        morceaux.forEach((morceau, index) => {
          const cle = `${symbole}#${index}`;
          if (!groupes.has(cle)) groupes.set(cle, { morceau, placements: [] });
          groupes.get(cle).placements.push({ col, ligne });
        });
      }
    }

    const matrice = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const echelle = new THREE.Vector3();

    for (const [, { morceau, placements }] of groupes) {
      const maille = new THREE.InstancedMesh(morceau.geometrie, morceau.materiau, placements.length);
      placements.forEach(({ col, ligne }, i) => {
        const [dx, dy, dz] = morceau.position || [0, 0, 0];
        const [rx, ry, rz] = morceau.rotation || [0, 0, 0];
        const [sx, sy, sz] = morceau.echelle || [1, 1, 1];
        // Une petite rotation propre a chaque case : la foret ne fait pas
        // "papier peint" si chaque arbre est tourne differemment.
        const tourne = (col * 7 + ligne * 13) % 8 * 0.7854;
        position.set(col + 0.5 + dx, dy, ligne + 0.5 + dz);
        euler.set(rx, ry + (morceau.geometrie.type === 'BoxGeometry' ? 0 : tourne), rz);
        quaternion.setFromEuler(euler);
        echelle.set(sx, sy, sz);
        matrice.compose(position, quaternion, echelle);
        maille.setMatrixAt(i, matrice);
      });
      maille.castShadow = true;
      maille.receiveShadow = true;
      this.decor.add(maille);
      if (morceau.contour) ajouterContour(maille, morceau.contour);
    }

    /* --- Ambiance : dehors clair, dedans sombre ----------------------- */
    const fond = new THREE.Color(carte.fond || '#0b0a12');
    if (interieur) {
      this.scene.background = fond;
      this.scene.fog = new THREE.Fog(fond.getHex(), 12, 34);
      this.lumiereAmbiante.intensity = 1.15;
      this.lumiereAmbiante.groundColor.setHex(0x4a3a28);
      this.lumiereAmbiante.color.setHex(0xffe6c0);
      this.soleil.intensity = 1.9;
    } else {
      // Dehors : c'est le dome de ciel qui fait le fond, et le brouillard
      // prend la couleur de l'horizon pour que tout se raccorde.
      this.scene.background = null;
      this.scene.fog = new THREE.Fog(0xedd9bd, 45, 190);
      this.lumiereAmbiante.intensity = 1.5;   // les ombres restent lisibles
      this.lumiereAmbiante.color.setHex(0xdcefff);
      this.lumiereAmbiante.groundColor.setHex(0x6d8050);
      this.soleil.intensity = 2.1;
    }

    // L'ombre se cale sur la salle.
    this.soleil.target.position.set(L / 2, 0, H / 2);
    this.soleil.position.set(L / 2, 0, H / 2).addScaledVector(DIRECTION_SOLEIL, 28);
    this.premierCadrage = true;
  }

  _viderDecor() {
    for (const enfant of [...this.decor.children]) {
      this.decor.remove(enfant);
      enfant.traverse((o) => {
        if (o.isMesh && o.geometry && !o.geometry.userData?.partagee) {
          // Les geometries des tuiles sont partagees : on ne les jette pas.
          if (o.geometry.type === 'PlaneGeometry' || o.geometry.type === 'BoxGeometry') o.geometry.dispose?.();
        }
      });
    }
    if (this.textureSol) {
      this.textureSol.dispose();
      this.textureSol = null;
    }
  }

  /* =================================================================== */
  /* LES ENTITES : creees a la volee, suivies image par image            */
  /* =================================================================== */

  _creerPourEntite(entite) {
    switch (entite.type) {
      case 'joueur': {
        const g = creerPersonnage();
        g.userData.lame = creerLameEpee();
        g.add(g.userData.lame);
        return g;
      }
      case 'ennemi':
        return creerMonstre(entite.espece);
      case 'pnj': {
        const vieux = entite.sprite === 'sage_0';
        return creerPersonnage({
          haut: vieux ? 0x7b4fc4 : 0x4a8fd9,
          pantalon: vieux ? 0x5f3c9c : 0x6b4a2f,
          cheveux: vieux ? 0xe9e6de : 0x8b5a3c,
          yeux: 0x1b2036,
          taille: vieux ? 1.05 : 0.95,
        });
      }
      case 'coffre': return creerCoffre();
      case 'panneau': return creerPanneau();
      case 'bloc': return creerBloc();
      case 'ramassable': return creerRamassable(entite.objet);
      case 'projectile': return creerProjectile(entite.sprite);
      case 'bombe': return creerRamassable('bombes');
      default:
        return null; // zones de degats, dalles, passages : invisibles
    }
  }

  synchroniser(jeu, dt) {
    this.temps += dt;
    const vus = new Set();

    for (const entite of jeu.entites) {
      if (!entite.vivante) continue;
      let objet = this.entites.get(entite.id);
      if (!objet) {
        objet = this._creerPourEntite(entite);
        if (!objet) continue;
        objet.userData.dernier = new THREE.Vector3();
        this.entites.set(entite.id, objet);
        this.groupeEntites.add(objet);
        objet.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
      }
      vus.add(entite.id);
      this._placer(objet, entite, dt);
    }

    // Ce qui a disparu du jeu disparait de l'ecran.
    for (const [id, objet] of this.entites) {
      if (vus.has(id)) continue;
      this.groupeEntites.remove(objet);
      this.entites.delete(id);
    }
  }

  _placer(objet, entite, dt) {
    const x = (entite.x + entite.largeur / 2) * U;
    const z = (entite.y + entite.hauteur / 2) * U;
    const saut = -(entite.hauteurSaut || 0) * U;
    objet.position.set(x, saut, z);

    // Orientation : le personnage regarde dans sa direction de jeu.
    const caps = { bas: 0, droite: Math.PI / 2, haut: Math.PI, gauche: -Math.PI / 2 };
    if (entite.direction in caps) {
      const cible = caps[entite.direction];
      const ecart = cible - objet.rotation.y;
      objet.rotation.y += Math.atan2(Math.sin(ecart), Math.cos(ecart)) * Math.min(1, dt * 14);
    }

    // Clignotement quand on est invincible : comme en 2D.
    objet.visible = !(entite.invincible > 0 && Math.floor(entite.invincible * 20) % 2 === 0);

    // Marche : on anime a partir du deplacement reellement effectue.
    const membres = objet.userData.membres;
    if (membres) {
      const precedent = objet.userData.dernier;
      const vitesse = Math.hypot(x - precedent.x, z - precedent.z) / Math.max(dt, 0.0001);
      precedent.set(x, saut, z);
      const cadence = Math.sin(this.temps * 11) * Math.min(1, vitesse / 3);
      membres.jambeG.rotation.x = cadence * 0.8;
      membres.jambeD.rotation.x = -cadence * 0.8;
      if (membres.brasG) membres.brasG.rotation.x = -cadence * 0.7;
      if (membres.brasD) membres.brasD.rotation.x = cadence * 0.7;
      objet.position.y += Math.abs(Math.sin(this.temps * 11)) * 0.02 * Math.min(1, vitesse / 3);
    }

    // Le gluant respire, la chauve-souris bat des ailes.
    if (objet.userData.rebondir) {
      objet.scale.y = 1 + Math.sin(this.temps * 6 + entite.id) * 0.09;
    }
    if (objet.userData.ailes) {
      const battement = Math.sin(this.temps * 18) * 0.9;
      objet.userData.ailes[0].rotation.z = battement;
      objet.userData.ailes[1].rotation.z = -battement;
      objet.position.y += 0.05 + Math.sin(this.temps * 3 + entite.id) * 0.05;
    }

    // Les objets au sol tournent doucement sur eux-memes.
    if (objet.userData.tourne) {
      objet.userData.tourne.rotation.y += dt * 2.2;
      objet.position.y += Math.sin(this.temps * 3 + entite.id) * 0.04;
      objet.visible = entite.opacite > 0.5;
    }

    // Le coffre s'ouvre.
    if (objet.userData.couvercle) {
      const vise = entite.ouvert ? -1.9 : 0;
      objet.userData.couvercle.rotation.x += (vise - objet.userData.couvercle.rotation.x) * Math.min(1, dt * 6);
    }

    // Le coup d'epee du heros.
    if (objet.userData.lame) {
      const enCours = entite.attaqueRestante > 0;
      objet.userData.lame.visible = enCours;
      if (enCours) {
        const avancee = 1 - entite.attaqueRestante / 0.22;
        objet.userData.lame.rotation.z = -Math.PI * 0.55 + avancee * Math.PI * 0.6;
        // Le trait s'efface en fin de geste.
        objet.userData.lame.material.opacity = 0.65 * (1 - avancee * 0.7);
      }
    }

    // Les projectiles pointent la ou ils vont.
    if (entite.type === 'projectile') {
      objet.rotation.y = Math.atan2(entite.vx, entite.vy);
      objet.children[0].rotation.x = Math.PI / 2;
    }
  }

  /* =================================================================== */
  /* LA CAMERA : elle cadre la salle, et suit un peu le heros            */
  /* =================================================================== */

  cadrerSalle(carte, joueur, dt) {
    const L = carte.largeur;
    const H = carte.hauteur;
    const cx = L / 2;
    const cz = H / 2;

    // Distance de recul : on cadre sur la PROFONDEUR de la salle, quitte a
    // deborder un peu en largeur. Cadrer sur la largeur eloignait tellement
    // la camera que le heros devenait un pion.
    const demiChamp = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const distance = (H / 2 / Math.tan(demiChamp)) * 0.74;

    // La camera suit le heros : il reste bien lisible, et on devine le
    // reste de la salle autour de lui.
    let viseX = cx;
    let viseZ = cz;
    if (joueur) {
      const jx = (joueur.x + joueur.largeur / 2) * U;
      const jz = (joueur.y + joueur.hauteur / 2) * U;
      viseX = cx + (jx - cx) * 0.55;
      viseZ = cz + (jz - cz) * 0.5;
    }

    const inclinaison = THREE.MathUtils.degToRad(55); // 90 = pile au-dessus
    this.positionCamera.set(
      viseX,
      Math.sin(inclinaison) * distance,
      viseZ + Math.cos(inclinaison) * distance
    );
    this.cibleCamera.set(viseX, 0.4, viseZ - 0.4);

    if (this.premierCadrage) {
      this.camera.position.copy(this.positionCamera);
      this.premierCadrage = false;
    } else {
      this.camera.position.lerp(this.positionCamera, Math.min(1, dt * 4));
    }
    this.camera.lookAt(this.cibleCamera);
  }

  /* =================================================================== */

  majEtRendre(jeu, dt) {
    // La salle a-t-elle change (porte ouverte, buisson coupe) ?
    if (jeu.carte !== this.carte || jeu.carte.version !== this.versionCarte) {
      this.construireSalle(jeu.carte);
    }
    this.synchroniser(jeu, dt);
    this.cadrerSalle(jeu.carte, jeu.joueur, dt);
    this.ambiance.maj(dt, this.camera);
    this.rendu.render(this.scene, this.camera);
  }
}
