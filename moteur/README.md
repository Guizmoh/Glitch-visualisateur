# Moteur de jeu Zelda-like

Un petit moteur de jeu d'action-aventure en vue de dessus, écrit en JavaScript
pur, **sans aucune dépendance et sans étape de compilation**. Il est pensé pour
qu'un enfant puisse créer son jeu en modifiant des fichiers simples, pendant
qu'un adulte (ou un grand frère) s'occupe du reste.

Tout — code, commentaires, noms de variables — est en français.

| | |
|---|---|
| **Jouer (3D)** | `index3d.html` — la version de référence |
| **Jouer (2D)** | `index.html` — même jeu, vue de dessus |
| **Dessiner des cartes** | `editeur.html` |
| **Voir la même carte en 3D** | `maquette-3d.html` (style N64) |
| **… en beaucoup plus détaillé** | `maquette-3d-detaillee.html` |
| **Premiers pas (enfant)** | [GUIDE-ENFANT.md](GUIDE-ENFANT.md) |
| **Recettes (« comment faire … ? »)** | [RECETTES.md](RECETTES.md) |

---

## Les deux affichages, un seul jeu

Le jeu existe en **2D** et en **3D**, et c'est **exactement le même jeu** : mêmes
salles, mêmes ennemis, mêmes coffres, mêmes dialogues, mêmes règles. Seul
l'affichage change.

C'est possible parce que la simulation reste plate : les entités vivent dans un
monde en pixels vu de dessus, et la vue 3D se contente de *regarder* ce monde et
de le redessiner en volume (16 pixels = 1 case = 1 unité 3D). Le fichier
`src/rendu3d/vue3d.js` est le seul à savoir que la 3D existe ; `src/jeu/` n'en
sait rien.

Conséquence pratique : **tout ce qu'on crée dans `contenu/` apparaît dans les
deux versions**, et l'éditeur de cartes sert aux deux.

```
src/rendu3d/
├── materiaux.js   cel shading, contours à l'encre, textures des tuiles
├── formes.js      à quoi ressemble, en volume, chaque tuile et chaque entité
└── vue3d.js       la scène : décor, entités, caméra
```

## Démarrer

Le moteur utilise les modules JavaScript : il lui faut un petit serveur local
(ouvrir le fichier directement avec `file://` ne marche pas).

```bash
# depuis la racine du dépôt
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/moteur/
```

Ou, avec Node :

```bash
npx http-server -p 8000
```

Dans VS Code, l'extension **Live Server** fait la même chose en un clic.
Une fois publié sur GitHub Pages, le jeu est directement accessible à
l'adresse `…/moteur/`.

### La maquette 3D

`maquette-3d.html` n'est pas le moteur : c'est une **maquette**, pour montrer
à quoi ressemblerait le jeu en vue Ocarina of Time. Elle relit les mêmes
données que le jeu 2D (la carte du village dans `contenu/cartes.js`, les
couleurs des tuiles, les sprites du HUD) et les affiche en volume, en
low-poly N64 : brouillard, textures 16×16 en filtrage « plus proche voisin »,
ciel dégradé. On s'y promène avec les flèches, A et E tournent la caméra.
Elle charge Three.js depuis un CDN — c'est la seule partie du projet qui
dépend d'Internet.

`maquette-3d-detaillee.html` pousse le même exercice beaucoup plus loin :
véritable cel shading (rampe de tons à 4 paliers + contours à l'encre par
coque inversée), terrain sculpté par du bruit fractal et *terrassé* pour
produire des plateaux à parois verticales, textures de sol générées pixel par
pixel (herbe, terre, roche) mélangées selon la pente et plaquées en
**projection triplanaire** pour ne pas s'étirer sur les falaises, 56 000 brins
d'herbe instanciés et animés par un shader de vent, deux essences d'arbres,
ciel calculé (dégradé, halo solaire, nuages fBm), éclairage d'heure dorée,
brouillard aérien raccordé à la couleur de l'horizon et exposition ACES.
Toujours zéro fichier d'image : tout est fabriqué par le code au démarrage.

Elle contient aussi un **overboard** jouable, pour surfer le relief. Toute la
mécanique tient en trois règles : la gravité pousse le long de la pente ; on
décolle quand le sol se dérobe plus vite qu'on ne tombe ; à l'atterrissage on
ne conserve que la vitesse *parallèle* au sol. La troisième fait tout le jeu —
retomber à plat sur une pente descendante garde (et augmente) la vitesse,
retomber en piqué la détruit. Les constantes sont réunies en haut de
`REGLAGES_PLANCHE`, faites pour être bidouillées.

Commandes : **flèches ou ZQSD** pour diriger, **Espace** (maintenu = plus haut)
pour sauter, **Maj** pour se baisser, **R** pour remonter en haut d'une pente,
**B** pour descendre de la planche. La caméra se tourne à la souris (glisser)
et la molette règle la distance — aucune lettre n'est utilisée pour la caméra,
pour ne pas entrer en conflit avec ZQSD sur un clavier AZERTY.

### Raccourcis utiles

| Adresse | Effet |
|---|---|
| `index.html` | le jeu normal |
| `index.html?salle=donjon-2` | démarre directement dans une salle (test rapide) |
| `index.html?salle=__test__` | joue la salle en cours dans l'éditeur |
| `editeur.html` | éditeur de cartes |

Dans la console du navigateur, `window.jeu` donne accès au moteur en direct :

```js
jeu.sceneActive.inventaire.donner('arc');   // s'offrir un objet
jeu.sceneActive.joueur.pvMax = 20;          // tricher un peu
jeu.ralenti = 0.3;                          // ralenti, pour observer
```

---

## Ce que le moteur sait déjà faire

- **Déplacement 8 directions** avec collisions, glissement le long des murs.
- **Combat** : épée (zone de dégâts devant le héros), recul, invincibilité
  temporaire, clignotement, flash blanc, particules.
- **Ennemis pilotés par des données** : une fiche + un comportement.
  8 comportements fournis (errant, poursuite, sauteur, volant, patrouille,
  tireur, chargeur, boss) et on peut en ajouter.
- **Objets** : cœurs, rubis, clés, bombes, flèches, arc, bouclier, palmes,
  réceptacles de cœur… avec inventaire, objet équipé et munitions.
- **Décor interactif** : buissons coupables, pots cassables, rochers à faire
  sauter, pics, trous, eau (avec palmes), blocs poussables, dalles de pression,
  cristaux, coffres, portes à clé, porte de boss, grilles qui s'ouvrent quand
  la salle est nettoyée, escaliers, panneaux.
- **Monde en salles** façon Zelda 1 : une salle = un écran, transition en
  glissement sur les bords, fondu au noir pour les escaliers.
- **Personnages et dialogues** avec variantes conditionnelles (le sage ne dit
  pas la même chose avant et après qu'on ait l'épée).
- **Interface** : cœurs (et demi-cœurs), compteurs, objet équipé, nom de salle,
  boîte de dialogue avec portrait et texte machine à écrire, menu pause.
- **Son et musique générés par le code** (aucun fichier audio à fournir).
- **Graphismes générés par le code** : les sprites sont écrits en texte, les
  textures de sol sont fabriquées au démarrage. Aucune image à télécharger.
- **Sauvegarde automatique** dans le navigateur (position, vie, inventaire,
  événements déjà accomplis).
- **Manette et commandes tactiles** en plus du clavier.

---

## Organisation des fichiers

```
moteur/
├── index.html            le jeu
├── editeur.html          l'éditeur de cartes
├── style.css             habillage de la page
└── src/
    ├── main.js           démarrage
    ├── noyau/            le moteur lui-même (rarement à modifier)
    │   ├── moteur.js         boucle de jeu, pile de scènes
    │   ├── scene.js          classe de base d'une scène
    │   ├── rendu.js          écran, caméra, outils de dessin
    │   ├── entrees.js        clavier / manette / tactile → « actions »
    │   ├── pixels.js         dessins en texte → images, textures
    │   ├── animation.js      animations de sprites
    │   ├── particules.js     étincelles, poussière, explosions
    │   ├── audio.js          bruitages et musique (Web Audio)
    │   ├── maths.js          boîte à outils de calcul
    │   ├── minuteur.js       comptes à rebours, métronomes
    │   ├── evenements.js     bus d'événements
    │   └── sauvegarde.js     localStorage
    ├── monde/
    │   ├── tuileset.js       fabrique les images des tuiles
    │   └── carte.js          une salle : grille, collisions, casse
    ├── jeu/                  les règles du jeu
    │   ├── entite.js         Entite + Acteur (vie, dégâts, recul)
    │   ├── physique.js       collisions décor + entités
    │   ├── joueur.js         le héros
    │   ├── ennemi.js         les ennemis
    │   ├── comportements.js  les « cerveaux » des ennemis
    │   ├── combat.js         zones de dégâts, explosions
    │   ├── projectile.js     flèches, boules magiques, bombes
    │   ├── ramassable.js     objets au sol et butin
    │   ├── inventaire.js     le sac du héros
    │   ├── interactifs.js    coffres, portes, blocs, dalles, passages…
    │   ├── pnj.js            personnages qui parlent
    │   └── fabrique.js       données → entités
    ├── ui/
    │   ├── hud.js            cœurs, compteurs, objet équipé
    │   ├── dialogue.js       boîte de texte
    │   └── transitions.js    fondus
    ├── scenes/
    │   ├── scene-titre.js    écran-titre
    │   ├── scene-jeu.js      la partie (chef d'orchestre)
    │   ├── scene-pause.js    menu pause / inventaire
    │   └── scene-fin.js      victoire / game over
    └── contenu/          ★ CE QUE L'ON MODIFIE POUR CRÉER SON JEU ★
        ├── config.js         les réglages (vitesse, vie, titre…)
        ├── cartes.js         les salles du monde
        ├── sprites.js        tous les dessins, en texte
        ├── tuiles.js         le décor : à quoi sert chaque lettre
        ├── ennemis.js        le bestiaire
        ├── objets.js         les objets ramassables et permanents
        ├── dialogues.js      ce que disent les personnages
        └── musiques.js       les partitions
```

**La règle d'or** : pour créer *son* jeu, on ne touche qu'au dossier
`contenu/`. Le reste, c'est la machine.

---

## Comment ça marche, en trois idées

### 1. La boucle de jeu

60 fois par seconde, `moteur.js` fait toujours la même chose :

```
lire les commandes  →  mettre à jour (maj)  →  dessiner
```

`dt` est le temps écoulé depuis l'image précédente, en secondes. On multiplie
toutes les vitesses par `dt` : le jeu tourne alors à la même vitesse sur un
ordinateur lent et sur un rapide.

### 2. Les entités

Tout ce qui vit dans une salle est une `Entite` : le héros, un gluant, un
cœur par terre, un coffre. Une entité a une position, une boîte de collision,
une méthode `maj(dt, scene)` et une méthode `dessiner(ctx, scene)`.
Un `Acteur` est une entité qui a des points de vie.

Les points de vie se comptent en **demi-cœurs** : `pv: 6` = 3 cœurs.

### 3. Les données plutôt que le code

Un ennemi n'est pas une classe à écrire, c'est une fiche :

```js
mon_monstre: { nom: 'Mon monstre', pv: 6, vitesse: 40, degats: 1,
               ia: 'poursuite', sprite: 'gluant' },
```

Une salle est un dessin en lettres :

```js
decor: [
  'WWWWWWWWWDWWWWWWWWWW',
  'WFFFFFFFFFFFFFFFFFFW',
  …
],
entites: [
  { type: 'ennemi', espece: 'mon_monstre', x: 6, y: 4 },
],
```

C'est ce qui rend l'ajout de contenu si rapide — et c'est ce qu'un enfant peut
faire tout seul.

---

## Ajouter des mécaniques (pour l'adulte)

Le moteur est prévu pour être étendu à trois endroits :

| Ce qu'on veut ajouter | Où |
|---|---|
| Un comportement d'ennemi | `COMPORTEMENTS.mon_ia = (ennemi, dt, scene) => …` dans `jeu/comportements.js` |
| Un type d'objet dans les cartes | `FABRIQUES.mon_type = (donnees) => new MaClasse(…)` dans `jeu/fabrique.js` |
| Un objet utilisable | une entrée dans `contenu/objets.js` avec `utiliser({ joueur, scene })` |
| Une tuile avec un effet | une entrée dans `contenu/tuiles.js` (`solide`, `degats`, `casse`, `role`…) |
| Un bruitage | une recette dans `SONS` (`noyau/audio.js`) |
| Un écran (carte du monde, boutique…) | une classe qui hérite de `Scene`, empilée avec `moteur.empiler(…)` |

Les objets utiles depuis une entité, via `scene` :

```js
scene.joueur            le héros
scene.carte             la salle (grille, collisions, casse)
scene.entites           toutes les entités
scene.ajouter(entite)   ajoute une entité
scene.inventaire        le sac
scene.particules.emettre(x, y, options)
scene.audio.jouer('epee')
scene.camera.secouer(3, 0.3)
scene.dialogue.montrer(['Bonjour !'])
scene.leverDrapeau('nom')   /  scene.drapeauLeve('nom')
scene.changerDeSalle('donjon-1', { arrivee: [9, 9] })
```

Les **drapeaux** mémorisent ce qui est déjà arrivé (coffre ouvert, boss vaincu,
porte déverrouillée). Ils sont sauvegardés avec la partie.

---

## Limites connues

- Une salle fait exactement un écran (20 × 12 cases). Le moteur gère des cartes
  plus grandes avec caméra qui suit, mais les transitions en glissement sont
  pensées pour l'écran unique.
- Pas de gestion de hauteur (sauter par-dessus un trou, falaises à deux
  niveaux) : c'est un jeu « à plat », comme le premier Zelda.
- La musique est un simple séquenceur monophonique : c'est volontairement
  minimal, pour rester lisible.
