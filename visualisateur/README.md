# Visualisateurs audio

Deux pages, deux rendus très différents, le même fonctionnement : on dépose un
morceau, l'image réagit au son. Chacune tient dans **un seul fichier**, sans
dépendance et sans étape de compilation, et se passe de serveur (le double-clic
suffit). Rien n'est envoyé nulle part : le son est lu et analysé dans le
navigateur.

| | |
|---|---|
| **Tempête de particules** | [`particules.html`](particules.html) — sable gris, cœur en feu |
| **VHS / glitch** | [`index.html`](index.html) — scanlines, déchirures, datamosh |

Les deux pages ont un lien vers l'autre, en haut à gauche.

---

## Ce qu'elles partagent

- Dépôt de fichier (mp3, wav, ogg, m4a, flac…) ou sélecteur classique.
- Une **démo intégrée** : une boucle à 120 BPM fabriquée à la volée, pour
  essayer sans rien avoir sous la main.
- Barre de lecture, volume, plein écran, interface qui s'efface toute seule.
- Sortie **image PNG** et **enregistrement `.webm`** (image + son) via
  `MediaRecorder` — Firefox et Chrome savent le faire, Safari non.

### Raccourcis

| Touche | Effet |
|---|---|
| `Espace` | lecture / pause |
| `R` | ouvrir/fermer les réglages |
| `F` | plein écran |
| `H` | masquer l'interface |
| `S` | enregistrer une image PNG |
| `1` … `5` | changer de preset / de matière |

### L'analyse du son

Identique dans les deux pages : `AudioContext` → `AnalyserNode`, FFT sur 2048
points. On en tire `basses`, `mediums`, `aigus`, `volume`, plus un détecteur de
frappe (`choc`) fondé sur le **flux spectral** — quand l'énergie monte
brutalement d'une image à l'autre, c'est un coup. Le curseur « Sensibilité »
règle l'ensemble.

---

## `particules.html` — la tempête

Une tempête de sable gris qui tourbillonne autour d'un cœur en feu, calculée
**entièrement sur la carte graphique** : jusqu'à deux millions de grains, dont
positions et vitesses vivent dans des textures flottantes relues et réécrites à
chaque image.

**Deux populations.** Le *sable* (92 % des grains) forme le voile extérieur ;
les *braises* (8 %) forment le cœur. Chacune est dessinée dans sa propre couche :

- le sable se dépose « par-dessus », comme de la peinture : là où il est dense,
  il **cache** le feu ; dans les trouées, on le devine ;
- les braises sont de grosses taches en lumière additive, floutées par les
  mipmaps : un gaz incandescent. Les grains de sable tout près du feu en
  prennent la couleur.

**Le mouvement.** Trois ingrédients :

1. un **tourbillon** : toute la tempête tourne autour d'un axe qui bascule sans
   cesse, avec un œil plus rapide près de l'axe. C'est une rotation *exacte*
   (formule de Rodrigues) : ajouter une vitesse tangente à chaque pas ferait
   dériver les grains vers l'extérieur et aplatirait tout en anneau ;
2. le **chaos** : le rotationnel d'un bruit (*curl noise*), un écoulement sans
   source ni puits qui dessine des volutes, des nappes et des fibres. Deux
   précautions le rendent stable. Il est calculé *dans le repère de la
   tempête*, qui tourne avec elle — sinon un grain qui tourne ne voit du bruit
   que sa moyenne sur son tour, un courant le long de l'axe qui entasse le
   sable aux pôles. Et son **courant moyen est mesuré puis soustrait** à chaque
   image (une mini-passe de 15 points) — sinon la boule, qui ne couvre que deux
   ou trois cellules de bruit, serait poussée tout entière d'un côté ;
3. la **coquille** : le sable est retenu dans un volume épais et creux, entre
   environ 0,4 et 1 fois le rayon de la tempête.

**La musique.** Un détecteur de grosse caisse (flux spectral limité aux basses)
déclenche l'**implosion** : le rayon s'effondre d'un coup puis se regonfle, et
la rotation accélère pendant la contraction — la patineuse qui ramène les bras.
Les temps forts **embrasent** le cœur, qui gonfle et déborde sur le sable. Les
aigus réveillent les filaments fins.

**Matières** : Tempête (sable gris, cœur rouge — la référence), Cendres (plus
épais, plus sombre), Poudre (rouille et poussière), Encre (bleu nuit),
Nébuleuse (violet, très rapide).

**Cadre** : plein écran, **vertical 9:16**, carré ou 16:9 — pratique pour
enregistrer une vidéo au format des réseaux.

**Qualité** : de 262 000 à 2 millions de grains. L'opacité de chaque grain
s'ajuste automatiquement : plus de grains donne une matière plus fine, pas plus
épaisse.

Il faut **WebGL2** et les textures flottantes (`EXT_color_buffer_float`) : tous
les navigateurs récents les ont. La page le dit franchement si ce n'est pas le
cas.

### Bidouiller

- **Couleurs et tempérament** : l'objet `MATIERES`, en haut du script
  (couleurs du sable et des braises, à quel point le sable cache le feu).
- **Physique** : la fonction `main()` du nuanceur `SIM` — chaque force y est
  commentée — et le morceau commun `CHAOS` pour la turbulence.
- **Réaction à la musique** : `majDynamique()` et `detecterCoup()`.
- **Aspect des grains** : `SABLE_S` / `SABLE_F` (le sable), `BRAISES_S` /
  `BRAISES_F` (le feu). **Étalonnage** : le nuanceur `SORTIE`.

---

## `index.html` — le rendu VHS

Une image est d'abord dessinée en canvas 2D, puis abîmée par deux passes
WebGL :

1. la passe **`GLITCH`** déchire l'image par tranches, décale les canaux de
   couleur, fait baver des macroblocs en relisant sa propre image de la frame
   précédente (*datamosh*) et use la bande ;
2. la passe **`ECRAN`** ajoute la courbure du tube, les scanlines, le masque
   RGB, le halo, la vignette et le grain.

**Presets** : Propre, VHS usée, Datamosh, Bug numérique, Bande morte.

**Images de base** : spectre en échelle logarithmique sur une grille en fuite,
mire de barres de fin d'émission, titre géant, ou **une image déposée** (JPG ou
PNG) qui devient le fond à glitcher.

### Bidouiller

- **Couleurs** : l'objet `PALETTES`. **Réglages par défaut** : l'objet `PRESETS`.
- **Nouvelle image de base** : une fonction `dessinerMachin(L, H, u, p)`
  appelée depuis `dessinerBase`, plus une `<option>` dans `#choixBase`.
- **Nouvel effet** : la chaîne `GLITCH`, en GLSL.

### Attention aux yeux

Ce rendu-là contient des flashs, du scintillement et des contrastes rapides —
à éviter en cas de photosensibilité. Le curseur **Intensité** ramène tout au
calme, et le preset **Propre** est presque sage.

---

## Performances

Les deux pages plafonnent leur résolution de rendu et proposent un réglage de
qualité. Si ça rame : baisse le nombre de grains (particules) ou la qualité
(VHS). Le réglage par défaut (590 000 grains) vise un ordinateur portable récent ;
baisse à 262 000 si ça saccade, monte à 1 ou 2 millions si ta carte graphique
suit.
