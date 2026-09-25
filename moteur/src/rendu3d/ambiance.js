/* =========================================================================
   ambiance.js — LE CIEL, L'HERBE ET LE PAYSAGE AUTOUR DE LA SALLE.

   Le jeu se joue sur un sol PLAT (c'est ce qui garde les collisions simples
   et identiques a la version 2D). Mais rien n'oblige le reste du monde a
   etre plat : autour de la salle, on peut poser des collines, une foret, un
   ciel. C'est exactement ce que font les vrais jeux — la zone jouable est
   sage, le decor lointain fait le spectacle.
   ========================================================================= */

import * as THREE from 'three';
import { matiereToon, ajouterContour, RAMPE_TONS } from './materiaux.js';

/* --------------------------------------------------------------------- */
/* Un bruit deterministe : le meme village aura toujours les memes arbres */
/* --------------------------------------------------------------------- */
function alea(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function bruit(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return alea(xi, yi) * (1 - u) * (1 - v)
    + alea(xi + 1, yi) * u * (1 - v)
    + alea(xi, yi + 1) * (1 - u) * v
    + alea(xi + 1, yi + 1) * u * v;
}

function fbm(x, y, octaves = 4) {
  let valeur = 0;
  let amplitude = 0.5;
  let frequence = 1;
  for (let i = 0; i < octaves; i++) {
    valeur += bruit(x * frequence, y * frequence) * amplitude;
    amplitude *= 0.5;
    frequence *= 2;
  }
  return valeur;
}

// Un soleil assez haut : en fin de journee les ombres s'etiraient tellement
// qu'elles hachaient toute la salle et brouillaient la lecture du jeu.
export const DIRECTION_SOLEIL = new THREE.Vector3(0.38, 0.82, -0.44).normalize();

/* ===================================================================== */
/* LE CIEL                                                               */
/* ===================================================================== */

function creerCiel() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        soleil: { value: DIRECTION_SOLEIL },
        temps: { value: 0 },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 soleil;
        uniform float temps;
        varying vec3 vDir;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float bruit(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 5; i++) { v += bruit(p) * a; p *= 2.02; a *= 0.5; }
          return v;
        }

        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 zenith  = vec3(0.17, 0.42, 0.78);
          vec3 horizon = vec3(0.93, 0.85, 0.74);
          vec3 couleur = mix(horizon, zenith, pow(h, 0.45));

          float s = max(dot(d, normalize(soleil)), 0.0);
          couleur += vec3(1.0, 0.66, 0.34) * pow(s, 7.0) * 0.5;
          couleur += vec3(1.0, 0.88, 0.66) * pow(s, 180.0) * 2.0;

          if (d.y > 0.02) {
            vec2 uv = d.xz / (d.y + 0.3) * 0.85 + vec2(temps * 0.003, temps * 0.0016);
            float n = fbm(uv * 1.3);
            float nuage = smoothstep(0.5, 0.85, n) * smoothstep(0.02, 0.24, d.y);
            vec3 tonNuage = mix(vec3(0.66, 0.64, 0.7), vec3(1.0, 0.95, 0.88), pow(s, 2.0) * 0.7 + 0.4);
            couleur = mix(couleur, tonNuage, nuage * 0.78);
          }
          gl_FragColor = vec4(couleur, 1.0);
        }`,
    })
  );
}

/* ===================================================================== */
/* L'HERBE : des milliers de brins agites par le vent                    */
/* ===================================================================== */

// Seules ces cases recoivent de l'herbe DANS la salle. Le chemin et le sable
// restent nets : on doit lire le terrain de jeu d'un coup d'oeil.
const LETTRES_HERBE = new Set(['.', ',']);

function creerMatiereHerbe() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        temps: { value: 0 },
        basHerbe: { value: new THREE.Color(0x417a2c) },
        hautHerbe: { value: new THREE.Color(0x77b845) },
        couleurSoleil: { value: new THREE.Color(0xfff0d0) },
      },
    ]),
    vertexShader: `
      attribute vec3 decalage;
      attribute vec3 variation;
      uniform float temps;
      varying float vHaut;
      varying float vLumiere;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        float haut = p.y / 0.24;
        vHaut = haut;

        float echelle = (0.7 + variation.x * 0.8) * variation.z;
        float angle = variation.y * 2.0;
        float ca = cos(angle), sa = sin(angle);
        p.xz = vec2(p.x * ca - p.z * sa, p.x * sa + p.z * ca);
        p *= echelle;

        // Deux ondes de vent qui traversent la prairie.
        float onde = sin(temps * 1.6 + decalage.x * 0.5 + decalage.z * 0.35)
                   + sin(temps * 2.9 + decalage.z * 0.9) * 0.4;
        float pliage = haut * haut * (0.3 + variation.x * 0.22);
        p.x += onde * pliage;
        p.z += onde * pliage * 0.5;

        vLumiere = 0.78 + 0.22 * abs(sin(angle * 1.7));
        vec4 mvPosition = modelViewMatrix * vec4(p + decalage, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 basHerbe, hautHerbe, couleurSoleil;
      varying float vHaut;
      varying float vLumiere;
      #include <fog_pars_fragment>
      void main() {
        vec3 couleur = mix(basHerbe, hautHerbe, vHaut * vHaut);
        couleur *= (0.72 + 0.28 * vLumiere) * mix(vec3(1.0), couleurSoleil, 0.5);
        gl_FragColor = vec4(couleur, 1.0);
        #include <fog_fragment>
      }`,
  });
}

/** Le brin : un losange etroit, deux triangles. */
function geometrieBrin() {
  const brin = new THREE.BufferGeometry();
  brin.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.024, 0, 0, 0.024, 0, 0, -0.010, 0.24, 0, 0.010, 0.24, 0,
  ], 3));
  brin.setIndex([0, 1, 2, 2, 1, 3]);
  return brin;
}

/* ===================================================================== */
/* L'AMBIANCE COMPLETE                                                   */
/* ===================================================================== */

export class Ambiance {
  constructor(scene, rendu) {
    this.scene = scene;
    this.rendu = rendu;
    this.temps = 0;

    this.ciel = creerCiel();
    this.ciel.frustumCulled = false;
    this.ciel.visible = false;
    scene.add(this.ciel);

    this.groupe = new THREE.Group();   // paysage lointain + herbe
    scene.add(this.groupe);

    this.matiereHerbe = creerMatiereHerbe();
    this.brin = geometrieBrin();
    this.herbe = null;
  }

  /** Reconstruit le decor lointain et l'herbe pour une salle. */
  configurer(carte, interieur) {
    this._vider();
    this.ciel.visible = !interieur;
    if (interieur) return;

    const L = carte.largeur;
    const H = carte.hauteur;
    const cx = L / 2;
    const cz = H / 2;

    this._planterHerbe(carte);
    this._poserPaysage(cx, cz, L, H);
  }

  _vider() {
    for (const enfant of [...this.groupe.children]) {
      this.groupe.remove(enfant);
      enfant.traverse?.((o) => {
        if (o.isMesh && o.geometry && o.geometry !== this.brin) o.geometry.dispose?.();
      });
    }
    this.herbe = null;
  }

  /* --- L'herbe, plantee sur les cases herbeuses de la salle ---------- */
  _planterHerbe(carte) {
    const DENSITE_SALLE = 9;     // brins par case DANS la zone de jeu
    const DENSITE_DEHORS = 26;   // bien plus dense autour : c'est du decor
    const MARGE = 10;            // cases d'herbe autour de la salle
    const decalages = [];
    const variations = [];

    const planter = (x, z, fondu) => {
      decalages.push(x, 0, z);
      variations.push(Math.random(), Math.random() * Math.PI, fondu);
    };

    // 1. Dans la salle, uniquement sur les cases ou de l'herbe a du sens.
    for (let ligne = 0; ligne < carte.hauteur; ligne++) {
      for (let col = 0; col < carte.largeur; col++) {
        const symbole = carte.symbole(col, ligne);
        if (!LETTRES_HERBE.has(symbole)) continue;
        for (let i = 0; i < DENSITE_SALLE; i++) {
          planter(col + Math.random(), ligne + Math.random(), 0.85);
        }
      }
    }

    // 2. Tout autour, pour que la salle ne flotte pas dans le vide.
    for (let ligne = -MARGE; ligne < carte.hauteur + MARGE; ligne++) {
      for (let col = -MARGE; col < carte.largeur + MARGE; col++) {
        const dedans = col >= 0 && ligne >= 0 && col < carte.largeur && ligne < carte.hauteur;
        if (dedans) continue;
        const distance = Math.max(
          0, -col, -ligne, col - carte.largeur + 1, ligne - carte.hauteur + 1
        );
        const fondu = Math.max(0, 1 - distance / MARGE);
        for (let i = 0; i < DENSITE_DEHORS * fondu; i++) {
          planter(col + Math.random(), ligne + Math.random(), fondu);
        }
      }
    }

    if (decalages.length === 0) return;

    const geometrie = new THREE.InstancedBufferGeometry();
    geometrie.index = this.brin.index;
    geometrie.attributes.position = this.brin.attributes.position;
    geometrie.instanceCount = decalages.length / 3;
    geometrie.setAttribute('decalage', new THREE.InstancedBufferAttribute(new Float32Array(decalages), 3));
    geometrie.setAttribute('variation', new THREE.InstancedBufferAttribute(new Float32Array(variations), 3));

    this.herbe = new THREE.Mesh(geometrie, this.matiereHerbe);
    this.herbe.frustumCulled = false;   // sinon three.js la fait disparaitre
    this.groupe.add(this.herbe);
  }

  /* --- Le paysage lointain : prairie, foret, collines --------------- */
  _poserPaysage(cx, cz, L, H) {
    // La prairie qui s'etend a perte de vue.
    const prairie = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      matiereToon(0x4e8a3a, { contour: 0 })
    );
    prairie.rotation.x = -Math.PI / 2;
    prairie.position.set(cx, -0.06, cz);
    prairie.receiveShadow = true;
    this.groupe.add(prairie);

    // Une foret autour, semee par le bruit : elle ferme l'horizon.
    const troncs = [];
    const houppiers = [];
    for (let i = 0; i < 2600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rayon = Math.max(L, H) * 0.62 + Math.pow(Math.random(), 0.7) * 110;
      const x = cx + Math.cos(angle) * rayon;
      const z = cz + Math.sin(angle) * rayon * 0.9;
      // On ne plante rien juste au bord de la salle : la vue doit rester claire.
      if (Math.abs(x - cx) < L / 2 + 4 && Math.abs(z - cz) < H / 2 + 4) continue;
      if (fbm(x * 0.02, z * 0.02, 3) < 0.46) continue;   // des clairieres
      const echelle = 0.8 + Math.random() * 0.9;
      troncs.push({ x, z, echelle, rotation: Math.random() * 6.28 });
    }

    const poser = (geometrie, materiau, liste, hauteur, contour) => {
      if (liste.length === 0) return;
      const maille = new THREE.InstancedMesh(geometrie, materiau, liste.length);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const p = new THREE.Vector3();
      const s = new THREE.Vector3();
      liste.forEach((arbre, i) => {
        e.set(0, arbre.rotation, 0);
        q.setFromEuler(e);
        p.set(arbre.x, hauteur * arbre.echelle, arbre.z);
        s.setScalar(arbre.echelle);
        m.compose(p, q, s);
        maille.setMatrixAt(i, m);
      });
      maille.frustumCulled = false;
      maille.castShadow = true;
      this.groupe.add(maille);
      if (contour) ajouterContour(maille, contour);
    };

    poser(new THREE.CylinderGeometry(0.16, 0.26, 1.9, 6), matiereToon(0x6b5238, { contour: 0.15 }), troncs, 0.95, 0.03);
    poser(new THREE.IcosahedronGeometry(0.95, 0), matiereToon(0x34702c, { contour: 0.25 }), troncs, 2.4, 0.045);
    poser(new THREE.IcosahedronGeometry(0.66, 0), matiereToon(0x468a30, { contour: 0.3 }), troncs, 3.2, 0.04);

    // Des collines au loin, juste pour que l'horizon respire.
    const collines = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rayon = 150 + Math.random() * 60;
      collines.push({
        x: cx + Math.cos(angle) * rayon,
        z: cz + Math.sin(angle) * rayon,
        echelle: 1,
        rotation: Math.random() * 6.28,
      });
    }
    const matColline = matiereToon(0x3f7a38, { contour: 0 });
    for (const colline of collines) {
      const maille = new THREE.Mesh(
        new THREE.ConeGeometry(16 + Math.random() * 14, 10 + Math.random() * 14, 6),
        matColline
      );
      maille.position.set(colline.x, 2, colline.z);
      maille.rotation.y = colline.rotation;
      this.groupe.add(maille);
    }
  }

  /* --- Le souffle du vent et la derive des nuages -------------------- */
  maj(dt, camera) {
    this.temps += dt;
    this.matiereHerbe.uniforms.temps.value = this.temps;
    this.ciel.material.uniforms.temps.value = this.temps;
    this.ciel.position.copy(camera.position);
  }
}
