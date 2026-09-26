# Visualisateurs audio

Deux pages, deux rendus très différents, le même fonctionnement : on dépose un
morceau, l'image réagit au son. Chacune tient dans **un seul fichier**, sans
dépendance et sans étape de compilation, et se passe de serveur (le double-clic
suffit). Rien n'est envoyé nulle part : le son est lu et analysé dans le
navigateur.

| | |
|---|---|
| **Nuage de particules** | [`particules.html`](particules.html) — poudre, encre, braises |
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

## `particules.html` — le nuage

Plusieurs centaines de milliers de grains simulés **entièrement sur la carte
graphique**. Positions et vitesses vivent dans des textures flottantes ; à
chaque image, un nuanceur les relit, les fait avancer et les réécrit
(ping-pong entre deux états, les deux sorties écrites d'un coup grâce au MRT).

Le mouvement vient d'un **champ de bruit rotationnel** (*curl noise*) : le
rotationnel d'un champ de potentiel n'a ni source ni puits, donc l'écoulement
se referme sur lui-même — d'où les volutes de fumée plutôt qu'une bouillie. Une
seconde octave, plus fine, est réveillée par les aigus : ce sont les filaments.

S'y ajoutent un souffle radial (basses et frappes), un rappel vers le centre,
une rotation, et une coquille interne que les grains ne peuvent pas franchir :
le disque sombre au milieu.

À l'affichage, un point par grain, en **lumière additive**, du pigment sombre
(grain lent) au blanc de poussière (grain rapide). L'image précédente n'est pas
effacée mais atténuée : ce sont les traînées. Puis lueur (lue dans les
mipmaps), exposition, vignette et grain.

**Matières** : Poudre (rouille et poussière), Encre (diluée dans l'eau),
Braises (étincelles chaudes), Cendres (gris, lent), Nébuleuse (violet, large).

**Cadre** : plein écran, **vertical 9:16**, carré ou 16:9 — pratique pour
enregistrer une vidéo au format des réseaux.

**Qualité** : de 65 000 à 590 000 grains. La taille des grains s'ajuste
automatiquement pour que la matière reste la même quand on change de densité.

Il faut **WebGL2** et les textures flottantes (`EXT_color_buffer_float`) : tous
les navigateurs récents les ont. La page le dit franchement si ce n'est pas le
cas.

### Bidouiller

- **Couleurs et tempérament** : l'objet `MATIERES`, en haut du script.
- **Physique** : la fonction `main()` du nuanceur `SIM` — chaque force y est
  commentée, et les uniformes `uBasses`, `uAigus`, `uChoc`… y sont déjà.
- **Aspect des grains** : le nuanceur `GRAINS_S` (taille, couleur) et
  `GRAINS_F` (forme du point).
- **Étalonnage de l'image** : le nuanceur `SORTIE`.

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
(VHS). Un ordinateur portable récent tient 60 images par seconde à 147 000
grains.
