# Recettes

Des réponses courtes à « comment je fais pour… ? ».
Chaque recette est autonome : copier, coller, adapter.

---

## Sommaire

- [Le monde](#le-monde)
- [Les ennemis](#les-ennemis)
- [Les objets](#les-objets)
- [Le décor](#le-décor)
- [Les personnages](#les-personnages)
- [Les énigmes](#les-énigmes)
- [Le look et le son](#le-look-et-le-son)
- [Aller plus loin (code)](#aller-plus-loin-code)

---

## Le monde

### Ajouter une salle

Dans `src/contenu/cartes.js` :

```js
  'ma-salle': {
    titre: 'La caverne secrete',
    musique: 'donjon',
    decor: [
      'WWWWWWWWWWWWWWWWWWWW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WFFFFFFFFFFFFFFFFFFW',
      'WWWWWWWWWFWWWWWWWWWW',
    ],
    sorties: { sud: 'plaine' },
    entites: [],
  },
```

Une salle fait **20 cases de large et 12 de haut**. Toujours.

### Relier deux salles par un bord

```js
// dans 'village'
sorties: { est: 'plaine' },
// dans 'plaine'
sorties: { ouest: 'village' },
```

Il faut une **case traversable au même endroit des deux côtés** :
si le village a une ouverture à droite sur les lignes 5 et 6, la plaine doit
avoir une ouverture à gauche sur les lignes 5 et 6.

### Ajouter un escalier / une grotte (fondu au noir)

```js
passages: [
  { x: 9, y: 4, vers: 'donjon-1', arrivee: [9, 9] },
],
```

`x, y` = la case de départ (mets aussi la lettre `S` à cet endroit du décor
pour qu'on voie l'escalier). `arrivee` = la case où le héros apparaît.

### Choisir la salle de départ

Dans `src/contenu/config.js` :

```js
salleDepart: 'village',
positionDepart: { x: 147, y: 131 },  // en PIXELS (case × 16 + 3)
```

### Tester une salle sans rejouer tout le jeu

`index.html?salle=ma-salle`

---

## Les ennemis

### Créer un ennemi

Dans `src/contenu/ennemis.js` :

```js
  araignee: {
    nom: 'Araignee',
    pv: 4,              // demi-coeurs
    vitesse: 55,
    degats: 1,
    ia: 'poursuite',
    sprite: 'chauve_souris',
    teinte: '#2f8f4a',  // recolorie le dessin
    largeur: 12, hauteur: 8,
    portee: 100,        // à partir de quelle distance il te voit
  },
```

Puis dans une salle :

```js
{ type: 'ennemi', espece: 'araignee', x: 7, y: 5 },
```

### Faire un ennemi qui tire

```js
  tourelle: {
    nom: 'Tourelle', pv: 6, vitesse: 0, degats: 1,
    ia: 'tireur', sprite: 'squelette',
    projectile: 'boule_magie',
    degatsProjectile: 1,
    cadence: 1.2,       // secondes entre deux tirs
  },
```

### Faire un boss

```js
  mon_boss: {
    nom: 'Gardien', boss: true,
    pv: 30, vitesse: 45, degats: 2,
    ia: 'boss_gluant', sprite: 'roi_gluant',
    images: ['roi_gluant_0'],
    largeur: 26, hauteur: 20, echelle: 2,
    ignoreRecul: true,
    drapeau: 'mon-boss-vaincu',   // pour qu'il ne revienne pas
    butin: [{ objet: 'coeur_max', chance: 1 }],
  },
```

`boss: true` affiche une barre de vie. `drapeau` fait qu'il reste mort.

### Choisir ce que lâche un ennemi

```js
butin: [
  { objet: 'coeur', chance: 0.5 },
  { objet: 'rubis_bleu', chance: 0.3, quantite: 2 },
],
```

`chance: 1` = à tous les coups. Sans `butin`, c'est le butin normal du jeu
(`BUTIN_PAR_DEFAUT` dans `objets.js`).

### Inventer un nouveau comportement

Dans `src/jeu/comportements.js` :

```js
COMPORTEMENTS.peureux = (ennemi, dt, scene) => {
  const joueur = scene.joueur;
  if (!joueur) return;
  const dx = ennemi.centreX - joueur.centreX;
  const dy = ennemi.centreY - joueur.centreY;
  const longueur = Math.hypot(dx, dy) || 1;
  // il s'enfuit dans la direction opposée au héros
  ennemi.avancer(dx / longueur, dy / longueur, ennemi.vitesse, dt, scene);
};
```

Puis `ia: 'peureux'` dans la fiche de l'ennemi.

---

## Les objets

### Ajouter un objet à ramasser

Dans `src/contenu/objets.js` :

```js
  pomme: {
    nom: 'Pomme', sprite: 'coeur', teinte: '#8ce04a', son: 'coeur',
    ramasser: ({ joueur }) => joueur.soigner(4),
  },
```

Le poser dans une salle : `{ type: 'objet', objet: 'pomme', x: 4, y: 6 }`

### Ajouter un objet permanent (un vrai trésor)

```js
  marteau: {
    nom: 'Marteau', sprite: 'icone_epee', permanent: true, son: 'secret',
    message: 'Un MARTEAU ! Il ecrase les pieux.',
    equipable: true,
    utiliser: ({ joueur, scene }) => {
      scene.audio.jouer('coup');
      scene.camera.secouer(3, 0.2);
    },
  },
```

`permanent: true` = il entre dans l'inventaire pour toujours.
`equipable: true` = on peut le mettre sur la touche **C**.

### Mettre un objet dans un coffre

```js
{ type: 'coffre', x: 9, y: 4, contenu: 'marteau', drapeau: 'coffre-marteau' },
```

Le `drapeau` doit être **différent pour chaque coffre** : c'est ce qui permet
au jeu de se souvenir qu'il est déjà ouvert.

Pour un coffre qui demande une clé : `verrouille: true`.

### Faire gagner la partie avec un objet

Dans `config.js` :

```js
objetDeVictoire: 'fragment',
```

Dès que le héros obtient cet objet, l'écran de victoire s'affiche.

---

## Le décor

### Les lettres du décor

| Lettre | Décor | Particularité |
|---|---|---|
| `.` | herbe | |
| `,` | herbe fleurie | |
| `:` | chemin de terre | |
| `_` | sable | |
| `=` | pont en bois | |
| `#` | mur de pierre | bloque |
| `W` | mur de donjon | bloque |
| `F` | sol de donjon | |
| `t` | tapis | |
| `~` | eau | bloque (sauf avec les palmes) |
| `L` | lave | 1 cœur de dégâts |
| `x` | trou | on tombe |
| `T` | arbre | bloque |
| `o` | buisson | se coupe à l'épée |
| `%` | rocher | se casse à la bombe |
| `p` | pot | se casse à l'épée |
| `^` | pics | ½ cœur de dégâts |
| `D` | porte à clé | |
| `B` | porte du boss | |
| `S` | escalier | |
| `I` | dalle de pression | ouvre les grilles `V` |
| `V` | grille | s'ouvre selon le `verrou` |
| `c` | cristal | se frappe à l'épée |
| `!` | torche | bloque |

### Créer une nouvelle tuile

Dans `src/contenu/tuiles.js` :

```js
  n: {
    nom: 'neige', style: 'sable',
    base: '#e8f0f8', ombre: '#c9d8e8', accent: '#ffffff',
    lent: true,   // le héros ralentit dessus
  },
```

Styles de texture disponibles : `plat`, `herbe`, `pierre`, `brique`, `eau`,
`sable`, `bois`, `terre`.

Options : `solide`, `degats`, `eau`, `trou`, `lent`, `casse`, `role`,
`dessusJoueur`.

### Une tuile qu'on peut casser

```js
  glace: {
    nom: 'bloc de glace', style: 'eau',
    base: '#9fd8f2', ombre: '#7ab8dd', accent: '#ffffff',
    solide: true,
    casse: { par: 'epee', devient: 'F', effet: 'pierre', son: 'coup', butin: 0.4 },
  },
```

`par` peut être `'epee'` ou `'bombe'`. `butin` = probabilité de faire tomber
un objet (0 à 1).

---

## Les personnages

### Un personnage qui parle

`dialogues.js` :

```js
  forgeron: {
    titre: 'Forgeron',
    variantes: [
      { pages: ['Mon marteau a disparu...', 'Tu veux bien le chercher ?'] },
    ],
  },
```

Dans une salle :

```js
{ type: 'pnj', dialogue: 'forgeron', sprite: 'villageois_0', x: 6, y: 5 },
```

Ajoute `errant: true` pour qu'il se balade.

### Un dialogue qui change selon la situation

```js
variantes: [
  { si: ({ drapeau }) => drapeau('marteau-rendu'),
    pages: ['Merci mille fois !'] },
  { si: ({ inventaire }) => inventaire.possede('marteau'),
    pages: ['Mon marteau ! Tu me le rends ?'],
    apres: ({ leverDrapeau, scene }) => {
      leverDrapeau('marteau-rendu');
      scene.inventaire.ajouter('rubis', 20);
    } },
  { pages: ['Mon marteau a disparu...'] },
],
```

La **première** variante dont le `si` est vrai est choisie. Une variante sans
`si` est le texte par défaut : mets-la en dernier.

### Un panneau à lire

```js
{ type: 'panneau', x: 8, y: 9, texte: ['Donjon ->', 'Attention aux pieux !'] },
```

---

## Les énigmes

### Une salle qui enferme le joueur jusqu'au dernier monstre

```js
'ma-salle': {
  verrou: 'ennemis',
  decor: [ …avec des lettres V dans les murs… ],
  entites: [ { type: 'ennemi', espece: 'gluant', x: 5, y: 5 } ],
},
```

### Une dalle qui ouvre une grille

Mets un `I` dans le décor et un bloc à pousser à côté :

```js
{ type: 'bloc', x: 12, y: 9 },
```

Le héros pousse le bloc en marchant contre lui pendant un court moment
(réglable : `tempsAvantPoussee` dans `config.js`).

### Un cristal à frapper

Mets simplement un `c` dans le décor. Un coup d'épée ouvre toutes les
grilles `V` de la salle.

### Une récompense qui apparaît quand la salle est nettoyée

```js
recompense: { objet: 'cle_boss', x: 9, y: 6 },
```

---

## Le look et le son

### Créer un sprite

Dans `src/contenu/sprites.js` :

```js
export const MON_SPRITE = [
  '................',
  '......8888......',
  '.....888888.....',
  …16 lignes de 16 caractères…
];
```

Puis ajoute-le au catalogue tout en bas du fichier :

```js
export const SPRITES = {
  …,
  mon_sprite_0: MON_SPRITE,
};
```

Toutes les lignes doivent avoir la **même longueur**. Le `.` est transparent.

### Recolorier un sprite existant

Sans redessiner : `teinte: '#4a90d9'` dans la fiche d'un ennemi ou d'un objet.

### Ajouter un bruitage

Dans `src/noyau/audio.js`, dans `SONS` :

```js
  saut: { forme: 'square', de: 300, vers: 700, duree: 0.15, volume: 0.2 },
```

Puis `scene.audio.jouer('saut')`.

`forme` : `square` (rétro), `triangle` (doux), `sawtooth` (agressif), `sine`.
`de` et `vers` sont les fréquences de début et de fin (en Hz).

### Écrire une musique

Dans `src/contenu/musiques.js` :

```js
  ma_musique: {
    options: { tempo: 120, forme: 'square', volume: 0.06 },
    notes: [
      ['do5', 1], ['mi5', 1], ['sol5', 2],
      ['fa5', 2], ['mi5', 2],
    ],
  },
```

Puis dans une salle : `musique: 'ma_musique',`

Notes disponibles : `do re mi fa sol la si` (+ `do5`, `mi5`… pour l'aigu,
`do3`, `mi3`… pour le grave) et `silence`.

### Changer la taille de l'écran

Dans `config.js` :

```js
largeurEcran: 320,   // 20 cases de 16 pixels
hauteurEcran: 192,   // 12 cases de 16 pixels
```

Si tu changes ça, change aussi la taille de tes cartes en conséquence.

---

## Aller plus loin (code)

### Ajouter un type d'entité placable dans les cartes

Dans `src/jeu/fabrique.js` :

```js
FABRIQUES.pancarte_lumineuse = (d) => new MaClasse({
  ...d,
  x: d.x * 16, y: d.y * 16,
});
```

Ensuite, `{ type: 'pancarte_lumineuse', x: 3, y: 4 }` fonctionne dans les cartes.

### Réagir à un événement du jeu

```js
import { evenements } from './src/noyau/evenements.js';

evenements.sur('ennemi-vaincu', ({ espece, boss }) => {
  console.log('vaincu :', espece);
});
```

Événements existants : `salle-chargee`, `ennemi-vaincu`, `objet-obtenu`,
`objet-equipe`, `inventaire-change`, `drapeau`.

### Créer un nouvel écran (boutique, carte du monde…)

```js
import { Scene } from './src/noyau/scene.js';

export class SceneBoutique extends Scene {
  constructor() { super('boutique'); this.transparente = true; }
  maj(dt) { if (this.entrees.pressee('pause')) this.moteur.depiler(); }
  dessiner(ctx) { /* … */ }
}

// pour l'afficher par-dessus le jeu :
moteur.empiler(new SceneBoutique());
```

### Déboguer

Dans la console du navigateur (F12) :

```js
jeu.sceneActive.entites            // tout ce qui vit dans la salle
jeu.sceneActive.drapeaux           // ce qui est déjà arrivé
jeu.sceneActive.inventaire.donner('arc')
jeu.ralenti = 0.2                  // ralenti pour observer une collision
localStorage.clear()               // effacer la sauvegarde
```

Et dans `config.js` : `montrerFps: true`.

Pour voir les zones de dégâts à l'écran, passe `visible: true` à la création
d'une `ZoneDegats` (dans `joueur.js`, méthode `attaquer`).
