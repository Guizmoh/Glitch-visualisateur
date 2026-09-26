# Visualisateur — rendu VHS / glitch

Un visualisateur audio qui rejoue l'esthétique d'une vieille cassette :
scanlines, décalage des couleurs, déchirures d'image, macroblocs qui bavent
(*datamosh*), bruit de bande et courbure de l'écran cathodique.

Tout tient dans **un seul fichier** (`index.html`), sans dépendance et sans
étape de compilation. Le son est lu et analysé dans le navigateur : aucun
fichier n'est envoyé nulle part.

| | |
|---|---|
| **Ouvrir** | `index.html` (double-clic suffit) |
| **En ligne** | une fois publié sur GitHub Pages : `…/visualisateur/` |
| **Essayer sans fichier** | bouton « Écouter la démo » (boucle fabriquée à la volée) |

---

## Utiliser

1. Dépose un fichier audio sur la page (mp3, wav, ogg, m4a, flac…) — ou clique
   sur **Choisir un fichier**.
2. Ouvre les **réglages** (bouton ⚙ ou touche `R`) pour changer de preset et
   doser chaque effet.
3. `F` passe en plein écran, `H` masque l'interface : c'est le mode
   « projection ».

L'interface s'efface toute seule après quelques secondes d'inactivité pendant
la lecture ; un mouvement de souris la fait revenir.

### Raccourcis

| Touche | Effet |
|---|---|
| `Espace` | lecture / pause |
| `R` | ouvrir/fermer les réglages |
| `F` | plein écran |
| `H` | masquer l'interface |
| `S` | enregistrer une image PNG |
| `1` … `5` | changer de preset |

### Presets

| | |
|---|---|
| **Propre** | à peine sale — pour bien voir l'image de base |
| **VHS usée** | la cassette qu'on a trop regardée |
| **Datamosh** | l'image précédente bave par blocs sur la suivante |
| **Bug numérique** | tout se déchire, canaux décalés à fond |
| **Bande morte** | le signal se perd, l'écran décroche |

### Images de base

Le glitch s'applique par-dessus une image, que l'on choisit dans les réglages :

- **Spectre + forme d'onde** — grille en fuite, anneau, barres de fréquences ;
- **Mire de barres** — la mire de fin d'émission, qui tremble avec la musique ;
- **Titre géant** — le nom du morceau, qui saute sur les frappes ;
- **Image déposée** — dépose un JPG ou un PNG sur la page, il devient le fond.

### Sortie

- **Image PNG** : une capture de l'écran tel quel.
- **Enregistrer** : un fichier `.webm` (image + son) via `MediaRecorder`.
  Firefox et Chrome savent faire ; Safari, non.

---

## Comment ça marche

Trois étages, dans cet ordre, soixante fois par seconde :

1. **Analyse** — `AudioContext` → `AnalyserNode` donne le spectre (FFT sur
   2048 points) et la forme d'onde. On en tire quatre valeurs : `basses`,
   `mediums`, `aigus`, `volume`, plus un détecteur de frappe (`choc`) basé sur
   le *flux spectral* : quand l'énergie monte brutalement, c'est un coup.
2. **Image de base** — dessinée en 2D dans un canvas hors écran
   (`dessinerSpectre`, `dessinerMire`, `dessinerTexte`, `dessinerImage`).
   C'est là qu'on met du contenu ; le glitch, lui, ne fait que l'abîmer.
3. **Deux passes WebGL** — l'image de base part dans une texture, puis :
   - la passe **`GLITCH`** déchire, décale les canaux, fait baver les
     macroblocs (elle relit sa propre image de la frame précédente : c'est ce
     qui produit le datamosh) et use la bande ;
   - la passe **`ECRAN`** ajoute la courbure du tube, les scanlines, le masque
     RGB, le halo, la vignette et le grain.

Les deux passes alternent entre deux cibles de rendu (`cibles[0]` et
`cibles[1]`) : celle d'avant sert de mémoire à celle d'après.

## Bidouiller

- **Changer les couleurs** : l'objet `PALETTES`, en haut du script. Chaque
  preset pointe vers une palette.
- **Régler un effet par défaut** : l'objet `PRESETS` — chaque valeur est un
  facteur, `1` étant le réglage nominal.
- **Ajouter une image de base** : écris une fonction `dessinerMachin(L, H, u, p)`
  (`L`/`H` = taille, `u` = facteur d'échelle du texte, `p` = palette), appelle-la
  depuis `dessinerBase`, puis ajoute une `<option>` au menu `#choixBase`.
- **Inventer un effet** : tout se passe dans la chaîne `GLITCH`, en GLSL. Les
  variables `uBasses`, `uMediums`, `uAigus`, `uVolume` et `uChoc` y sont déjà
  disponibles, entre 0 et 1.

## Performances

Le rendu se fait à 80 % de la résolution de l'écran par défaut, avec un plafond
de 2,6 millions de pixels. Si ça rame (vieille machine, grand écran), passe la
qualité sur **Économique** dans les réglages.

Il faut **WebGL** : tous les navigateurs de moins de dix ans l'ont, mais une
machine virtuelle sans accélération matérielle peut ramer. La page le dit
franchement si WebGL manque.

## Attention aux yeux

Le rendu contient des flashs, du scintillement et des contrastes rapides — à
éviter en cas de photosensibilité. Le curseur **Intensité** ramène tout au
calme d'un coup, et le preset **Propre** est presque sage.
