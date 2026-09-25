/* =========================================================================
   materiaux.js — L'habillage 3D : cel shading et contours a l'encre.

   Le principe du cel shading : la lumiere n'a pas le droit de varier en
   douceur. Elle ne peut prendre que quelques valeurs, ce qui donne des
   aplats nets, comme dans un dessin anime.
   ========================================================================= */

import * as THREE from 'three';
import { fabriquerTuile } from '../noyau/pixels.js';
import { TUILES, TUILE_DEFAUT } from '../contenu/tuiles.js';

/** La rampe de tons : une image de 4 pixels, lue sans adoucissement. */
export const RAMPE_TONS = new THREE.DataTexture(
  new Uint8Array([52, 116, 196, 255]), 4, 1, THREE.RedFormat
);
RAMPE_TONS.minFilter = THREE.NearestFilter;
RAMPE_TONS.magFilter = THREE.NearestFilter;
RAMPE_TONS.needsUpdate = true;

export const COULEUR_SOLEIL = new THREE.Color(0xfff0d0);

/**
 * Matiere cel : couleur en aplats + un liseré clair sur les bords, qui
 * detache l'objet du decor.
 */
export function matiereToon(couleur, options = {}) {
  const { contour = 0.45, transparent = false, opacite = 1 } = options;
  const materiau = new THREE.MeshToonMaterial({
    color: couleur,
    gradientMap: RAMPE_TONS,
    transparent,
    opacity: opacite,
  });
  materiau.onBeforeCompile = (shader) => {
    shader.uniforms.forceRim = { value: contour };
    shader.uniforms.couleurRim = { value: COULEUR_SOLEIL };
    shader.fragmentShader = `
      uniform float forceRim;
      uniform vec3 couleurRim;
      ${shader.fragmentShader}`
      .replace('#include <fog_fragment>', `
        float bordure = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 3.5);
        gl_FragColor.rgb += couleurRim * bordure * forceRim;
        #include <fog_fragment>`);
  };
  return materiau;
}

/** Matiere cel avec une texture : sert aux murs, qui gardent le grain 2D. */
export function matiereTexturee(texture, options = {}) {
  const materiau = matiereToon(0xffffff, options);
  materiau.map = texture;
  return materiau;
}

/* --------------------------------------------------------------------- */
/* Les textures des tuiles : exactement celles du jeu 2D, en plus grand.  */
/* --------------------------------------------------------------------- */

const cacheTextures = new Map();

export function textureTuile(symbole) {
  if (cacheTextures.has(symbole)) return cacheTextures.get(symbole);
  const def = TUILES[symbole] || TUILE_DEFAUT;
  const canvas = fabriquerTuile(def, 16, symbole.charCodeAt(0));
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;   // gros pixels assumes
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  cacheTextures.set(symbole, texture);
  return texture;
}

/* --------------------------------------------------------------------- */
/* Les contours a l'encre                                                 */
/* --------------------------------------------------------------------- */

/**
 * Methode de la "coque inversee" : on redessine l'objet une seconde fois,
 * legerement gonfle le long de ses normales, en noir, en ne gardant que ses
 * faces arriere. Il depasse tout autour : c'est le trait.
 */
export function matiereContour(epaisseur, couleur = 0x14121c) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { epaisseur: { value: epaisseur }, encre: { value: new THREE.Color(couleur) } },
    ]),
    vertexShader: `
      uniform float epaisseur;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        #include <beginnormal_vertex>
        #include <begin_vertex>
        transformed += objectNormal * epaisseur;
        #include <project_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 encre;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(encre, 1.0);
        #include <fog_fragment>
      }`,
  });
}

/** Ajoute un contour a une maille (marche aussi sur les InstancedMesh). */
export function ajouterContour(maille, epaisseur = 0.035) {
  const materiau = matiereContour(epaisseur);
  let contour;
  if (maille.isInstancedMesh) {
    contour = new THREE.InstancedMesh(maille.geometry, materiau, maille.count);
    contour.instanceMatrix = maille.instanceMatrix; // on partage les positions
  } else {
    contour = new THREE.Mesh(maille.geometry, materiau);
  }
  contour.castShadow = false;
  contour.receiveShadow = false;
  contour.frustumCulled = maille.frustumCulled;
  maille.add(contour);
  return maille;
}

/** Contourne toutes les mailles d'un groupe (un personnage, un coffre...). */
export function contournerGroupe(groupe, epaisseur = 0.022) {
  const mailles = [];
  groupe.traverse((o) => { if (o.isMesh && !o.userData.sansContour) mailles.push(o); });
  for (const m of mailles) ajouterContour(m, epaisseur);
  return groupe;
}
