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

**Deux populations.** Le *sable* (92 % des grains) forme la masse ; les
*braises* (8 %) forment le cœur. Chacune est dessinée dans sa propre couche :

- les braises d'abord, en lumière additive : un gaz incandescent, découpé en
  plaques et en langues, avec quelques foyers plus ardents ;
- puis le sable, déposé « par-dessus » comme de la peinture : là où il est
  dense il **cache** le feu. Chaque grain lit la lumière des braises à sa
  position — le rouge qu'on voit, c'est surtout le sable éclairé de
  l'intérieur. Un grain situé *devant* le feu n'en reçoit la lumière que sur
  sa face arrière : il reste gris, un voile sur le rouge.

**L'éclairage.** Une lumière en contre-jour, d'en haut et de l'arrière, ne
blanchit que le dessus et les bords ; un léger appoint de face garde le voile
gris ; de grands bourrelets d'ombre et de lumière, et l'épaisseur du sable
(les masses épaisses s'assombrissent en leur cœur), donnent le volume d'un
cumulus.

**Le mouvement.** Toute la tempête tourne d'un bloc autour d'un axe qui
bascule sans cesse (une rotation *exacte*, formule de Rodrigues), et un
**bruit rotationnel borné** la fait bouillonner. Borné, parce qu'un bruit
rotationnel ordinaire pousse les grains à travers la paroi de la boule, où ils
s'entassent — l'intérieur se vide. Suivant Bridson (*Curl-Noise for Procedural
Fluid Flow*, 2007), le potentiel s'éteint en douceur au bord : l'écoulement
reste sans divergence et *longe* la paroi au lieu de la traverser. Sa moyenne
sur la boule est alors exactement nulle — la tempête ne peut ni dériver, ni
s'aplatir, ni se tasser (vérifié en relisant les positions : densité uniforme,
rondeur 1, centre immobile, sur des dizaines de secondes). Ce champ est
calculé dans le repère qui tourne avec la tempête, évolue par fondu enchaîné
entre champs immobiles (un champ qui tourne ou qui glisse finirait par
entraîner le sable), et il est intégré au point milieu (Runge-Kutta 2) : un
pas droit « sortirait » des volutes à chaque image.

**L'organique.** Un écoulement sans divergence conserve la densité : on
choisit donc *où* naît le sable. Il naît en **bouffées** — des grains qui
naissent et meurent ensemble — de préférence dans certaines zones, et le
bord de la boule est bosselé à deux échelles. L'écoulement étire ces
bouffées en nappes et en filaments ; des masses denses et des trouées
apparaissent, bougent et se referment.

**La musique.** Le temps de la tempête suit la musique : lourd et presque
figé au repos, il s'emballe sur les coups de grosse caisse — c'est ce qui
donne ces rafales où tout tourbillonne d'un coup (avec un flou de mouvement :
les grains rapides sont aussi tracés en traits). Sur le même coup, la tempête
**implose** : elle rétrécit d'un coup puis se regonfle — une mise à l'échelle
au dessin, qui garde la densité parfaitement uniforme — et le cœur
**s'embrase**. Un détecteur dédié (flux spectral limité aux basses) repère
les coups de grosse caisse ; les aigus réveillent les filaments fins.

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
- **Physique** : le nuanceur `SIM` (`ecoulement()`, renaissances en bouffées
  et en foyers) et le morceau commun `CHAOS` (`chaosBorne()`, le bord bosselé).
- **Réaction à la musique** : `majDynamique()` et `detecterCoup()`.
- **Aspect des grains** : `SABLE_S` / `SABLE_F` (éclairage, voile, trouées),
  `BRAISES_S` / `BRAISES_F` (plaques et foyers). **Étalonnage** : `SORTIE`.

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
