# Fabrique ton jeu d'aventure 🗡️

Salut ! Tu vas fabriquer ton propre jeu, un peu comme Zelda.

Tu n'as **pas besoin de savoir programmer** pour commencer. Tu vas changer des
mots et des nombres dans des fichiers, et le jeu changera tout de suite.

> **Comment lancer le jeu ?** Demande à un adulte de lancer le petit serveur
> (c'est écrit dans le README), puis ouvre `http://localhost:8000/moteur/`.
> Pour voir tes changements : **sauvegarde le fichier**, puis **recharge la
> page** (touche F5).

---

## Les commandes du jeu

| Touche | Ce que ça fait |
|---|---|
| Flèches (ou Z Q S D) | marcher |
| Espace | épée / parler / ouvrir un coffre |
| C | utiliser l'objet équipé (arc, bombes) |
| P ou Échap | pause (et voir ton inventaire) |

---

## Les 3 fichiers les plus rigolos

Tout ce que tu vas modifier est dans le dossier **`src/contenu/`** :

| Fichier | Ce qu'il contient |
|---|---|
| `config.js` | les réglages : vitesse, vie, titre du jeu |
| `sprites.js` | **tous les dessins**, écrits avec des lettres |
| `cartes.js` | **les salles** du monde |
| `ennemis.js` | les monstres |
| `dialogues.js` | ce que disent les personnages |
| `objets.js` | les trésors |

---

# 🎯 Mission 1 — Change le titre de ton jeu

Ouvre `src/contenu/config.js`. Tout en haut, tu vois :

```js
titre: 'La Legende du Fragment',
```

Remplace par ce que tu veux :

```js
titre: 'La Legende de Tom',
```

Recharge la page. Le titre a changé sur l'écran d'accueil ! 🎉

> ⚠️ Attention : garde bien les `'` (apostrophes) autour du texte et la
> virgule à la fin. Si le jeu devient tout noir, c'est souvent une apostrophe
> ou une virgule oubliée.

---

# 🏃 Mission 2 — Rends le héros super rapide

Toujours dans `config.js` :

```js
vitesseHeros: 78,
```

Mets `160`. Recharge. Le héros fonce !

Essaie aussi :

- `vieDepart: 6` → mets `20` (tu as 10 cœurs)
- `degatsEpee: 2` → mets `10` (tu es super fort)
- `dureeAttaque: 0.22` → mets `0.6` (le coup d'épée dure longtemps)

**Question à se poser :** est-ce que le jeu est plus *amusant* quand on est
super fort ? Souvent, non ! Un bon jeu, c'est un jeu **un peu** difficile.
C'est ça, régler un jeu : essayer, jouer, ajuster.

---

# 🎨 Mission 3 — Change les couleurs du héros

Ouvre `src/contenu/sprites.js`. Tout en haut, il y a la **palette** :

```js
'3': '#57c96a', // tunique claire
'4': '#2f8f4a', // tunique ombre
```

Ces codes bizarres (`#57c96a`) sont des couleurs. Remplace-les par :

```js
'3': '#e04a4a', // tunique claire  → ROUGE
'4': '#8a2020', // tunique ombre
```

Recharge : ton héros est habillé en rouge ! Et les gluants aussi, parce qu'ils
utilisent la même couleur. 😄

> Pour trouver des couleurs, cherche « code couleur hexadécimal » sur Internet,
> ou demande à un adulte. `#ff0000` = rouge vif, `#0000ff` = bleu, etc.

---

# ✏️ Mission 4 — Dessine ton propre sprite

Descends dans `sprites.js` jusqu'à `HEROS_BAS_0`. Tu vois ça :

```js
export const HEROS_BAS_0 = [
  '................',
  '......0000......',
  '.....033330.....',
  …
];
```

Chaque ligne = une ligne de pixels. Chaque lettre = une couleur de la palette.
Le point `.` veut dire **transparent** (on voit à travers).

Essaie de changer quelques `3` en `8` (rouge) pour faire des taches sur la
tunique. Ou ajoute un chapeau plus grand.

**Règle importante :** toutes les lignes d'un dessin doivent avoir **exactement
la même longueur** (ici 16 caractères). Sinon le dessin est tordu.

💡 Astuce : c'est plus facile de dessiner d'abord sur du papier quadrillé !

---

# 🗺️ Mission 5 — Dessine ta première salle

Là, on sort l'outil magique : ouvre **`editeur.html`**.

1. À droite, choisis une tuile (de l'herbe, un arbre, un mur…).
2. Clique sur la carte pour peindre. **Clic droit** pour effacer.
3. Le **pot de peinture** remplit toute une zone d'un coup.
4. Avec **« Placer une entité »**, pose des monstres, des coffres, des
   personnages.
5. Clique sur **▶ Tester** : ta salle s'ouvre dans le jeu !

Quand elle te plaît :

6. Écris un **nom** pour ta salle (par exemple `ma-grotte`).
7. Clique sur **Copier le code**.
8. Ouvre `src/contenu/cartes.js` et colle le code **entre deux salles**
   (juste avant la ligne `};` tout en bas, par exemple).

Pour aller dans ta salle, teste avec :
`index.html?salle=ma-grotte`

---

# 🚪 Mission 6 — Relie ta salle au monde

Dans `cartes.js`, chaque salle a des **sorties** :

```js
sorties: { est: 'plaine', nord: 'bois' },
```

Ça veut dire : « si le héros sort par la droite, il arrive dans la salle
`plaine` ».

⚠️ **Le piège n°1 des créateurs de jeux** : il faut un **trou dans le mur des
deux côtés, au même endroit !**

Si le village a un trou dans le mur du haut aux cases 8 et 9, alors le bois
doit avoir un trou dans le mur du bas aux cases **8 et 9 aussi**. Sinon, le
héros arrive dans un mur.

Dans l'éditeur, les cases sont numérotées : regarde en bas du dessin, ça
affiche `case : x=8 y=0`.

---

# 👾 Mission 7 — Invente un monstre

Ouvre `src/contenu/ennemis.js`. Copie une fiche entière et change-la :

```js
  mon_monstre: {
    nom: 'Bouboule',
    pv: 10,          // en demi-coeurs : 10 = 5 coeurs
    vitesse: 70,
    degats: 2,
    ia: 'poursuite', // il te court après !
    sprite: 'gluant',
    teinte: '#4a90d9', // bleu
    largeur: 12, hauteur: 9,
  },
```

Les **cerveaux** disponibles (`ia`) :

| `ia` | Ce que fait le monstre |
|---|---|
| `errant` | se promène au hasard |
| `poursuite` | te court après quand il te voit |
| `sauteur` | fait des bonds vers toi (le gluant) |
| `volant` | vole en zigzag et traverse les murs |
| `patrouille` | fait des allers-retours |
| `tireur` | garde ses distances et tire |
| `chargeur` | vise, puis fonce tout droit |
| `immobile` | ne bouge pas |

Ensuite, place-le dans une salle (dans l'éditeur, ou à la main) :

```js
{ type: 'ennemi', espece: 'mon_monstre', x: 10, y: 6 },
```

---

# 💬 Mission 8 — Fais parler un personnage

Ouvre `src/contenu/dialogues.js` :

```js
  mon_ami: {
    titre: 'Léo',
    variantes: [
      { pages: [
          'Salut ! Tu cherches le tresor ?',
          'Il est cache derriere les rochers, au sud.',
        ] },
    ],
  },
```

Chaque texte entre `'` est une **page** : le joueur appuie sur Espace pour
lire la suite.

Puis pose-le dans une salle :

```js
{ type: 'pnj', dialogue: 'mon_ami', sprite: 'villageois_0', x: 5, y: 7 },
```

**Pour aller plus loin** : un personnage peut dire des choses différentes
selon la situation.

```js
variantes: [
  { si: ({ inventaire }) => inventaire.possede('epee'),
    pages: ['Waouh, tu as une epee !'] },
  { pages: ['Tu devrais trouver une arme...'] },
],
```

La **première** variante dont la condition est vraie gagne. La dernière, sans
`si`, c'est ce qu'il dit le reste du temps.

---

# 🧩 Mission 9 — Fabrique une énigme

Dans une salle de donjon, tu as trois façons d'enfermer le joueur derrière des
grilles (la lettre **`V`**) :

1. **Tuer tous les monstres.** Ajoute `verrou: 'ennemis',` à la salle.
2. **Marcher sur une dalle** (lettre `I`) — ou y pousser un bloc.
3. **Frapper un cristal** à l'épée (lettre `c`).

Et pour les portes :

- `D` = porte fermée à clé → il faut une **petite clé** (objet `cle`)
- `B` = porte du boss → il faut la **clé du boss** (objet `cle_boss`)

Mets la clé dans un coffre, de l'autre côté de l'énigme :

```js
{ type: 'coffre', x: 5, y: 3, contenu: 'cle', drapeau: 'ma-cle-secrete' },
```

Le `drapeau`, c'est le nom que le jeu retient pour se souvenir que tu as déjà
ouvert ce coffre. **Donne un nom différent à chaque coffre !**

---

# 🏆 Mission 10 — Ton monde à toi

Maintenant, fabrique **ton** aventure :

1. Dessine 4 à 6 salles dans l'éditeur.
2. Relie-les avec les sorties (attention aux trous dans les murs !).
3. Mets un personnage au début qui explique la quête.
4. Cache une clé quelque part.
5. Mets un boss derrière une porte `B`.
6. Dans la salle du boss, ajoute la récompense :

```js
recompense: { objet: 'fragment', x: 9, y: 6 },
```

Quand le joueur ramasse le `fragment`, il **gagne la partie** !

Et n'oublie pas dans `config.js` :

```js
salleDepart: 'village',   // la salle où on commence
positionDepart: { x: 147, y: 131 },
```

---

## 🆘 Ça ne marche plus !

| Ce qui se passe | Ce qu'il faut vérifier |
|---|---|
| L'écran est tout noir | Ouvre la console (touche **F12**) : le message rouge dit à quelle ligne est l'erreur. C'est souvent une **virgule** ou une **apostrophe** oubliée. |
| Le héros ne bouge pas | Il est peut-être coincé dans un arbre : change `positionDepart`. |
| « Salle inconnue » | Le nom dans `sorties` ne correspond à aucune salle de `cartes.js` (attention aux tirets et aux majuscules). |
| Le héros arrive dans un mur | Le trou dans le mur n'est pas au même endroit des deux côtés. |
| Le dessin est tordu | Une ligne du sprite n'a pas la même longueur que les autres. |
| Rien ne change | Tu as oublié de sauvegarder le fichier, ou de recharger la page (F5). |

---

## Ce que tu viens d'apprendre (c'est du vrai métier !)

- **Les données et le code sont séparés.** Le moteur ne sait pas ce qu'est un
  « gluant » : il lit une fiche. C'est comme ça que travaillent les vrais
  studios de jeu vidéo.
- **On teste tout le temps.** On change un nombre, on essaie, on ajuste.
- **Le level design**, c'est guider le joueur sans lui dire quoi faire :
  une porte fermée donne envie de chercher la clé.
- **Un bug, ce n'est pas grave.** C'est juste une ligne à corriger.

Bon jeu ! 🎮
