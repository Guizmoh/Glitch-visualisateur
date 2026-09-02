# Plan de morceau

Application web qui calcule **l'arrangement d'un morceau** : combien de mesures
d'intro, de couplet, de pré-refrain, de refrain, de pont, de solo, d'outro —
en fonction de la **durée visée**, du **tempo**, de la **signature rythmique**,
du **genre musical** et de l'**idée de morceau** choisis. Elle propose ensuite
plusieurs variantes de la même structure plutôt qu'une seule solution figée.

Une seule page, sans dépendance ni build : `index.html` s'ouvre directement
dans un navigateur.

## Ce que fait l'application

### Génération

- **20 genres** avec leur vocabulaire de sections : pop, rock, métal, punk,
  ballade, funk/soul, R&B, hip-hop/trap, trip-hop, EDM/house, techno,
  drum & bass, tribe/free party, jazz (AABA), blues 12 mesures, reggae,
  chanson française, folk, ambient, cinématique. Chaque genre porte sa durée
  type, son tempo et sa longueur de phrase, appliqués au changement de genre.
- **Moteur probabiliste** : les sections s'enchaînent selon une table de
  transitions musicales (intro → couplet, pré-refrain → refrain, montée →
  drop... certains enchaînements sont quasi interdits, comme un drop suivi
  d'une intro) plutôt que de suivre un gabarit unique et figé.
- **Variantes** : après une génération, trois boutons *Variante 1/2/3*
  proposent d'autres arrangements pour les mêmes contraintes (genre, durée,
  tempo, complexité, idée de morceau), et *Surprends-moi* change aussi le
  genre, l'idée et la complexité au hasard.
- **Curseur de complexité** (classique → expérimentale) : gouverne le nombre
  de types de sections utilisés, la probabilité des sections facultatives
  (pont, pré-refrain, break...) et la variété des longueurs. À 0, une pop
  se limite à intro/couplet/refrain/outro ; à 100, pont, pré-refrain et
  répétitions inhabituelles apparaissent.
- **Idée de morceau** : neuf intentions (classique, progressif, impact
  immédiat, hypnotique, évolutif, beaucoup de variations, minimaliste,
  cinématique, dansant) qui penchent le tirage sans changer le vocabulaire
  du genre — un même genre technoproduit une structure très différente en
  « hypnotique » (peu de sections, longues, presque sans rupture) qu'en
  « impact immédiat » (intro courte, énergie haute tout de suite).
- **BPM suggéré pour la durée exacte** : trois tempos, autour de celui du
  genre, qui font tomber la durée visée sur un compte de mesures rond pour
  ce genre — un clic règle le tempo et la structure tombe pile sur la cible.
- **Longueurs musicales** : les sections tombent sur des phrases entières
  (4, 8, 12 ou 32 mesures selon le genre), jamais des comptes arbitraires.
  L'écart final avec la durée visée est affiché, et expliqué quand le genre
  impose des blocs trop longs pour la durée demandée.

### Édition

- **Glisser-déposer** des sections par leur poignée (⋮⋮), ou flèches
  haut/bas au clavier quand la poignée a le focus.
- **Redimensionnement direct dans la frise** : on tire le bord droit d'un
  bloc, la longueur change par phrase du genre, avec une bulle qui affiche
  le compte de mesures pendant le geste.
- **Niveau de variation** par section (dépouillé / normal / enrichi /
  climax), qui décale la courbe d'énergie et densifie l'aperçu rythmique
  sans toucher au type ni à la durée.
- Renommer, dupliquer, supprimer, ajouter n'importe quel type de section.

### Écoute

- **Aperçu rythmique** : en plus du métronome simple, un mode « Motif »
  synthétise kick, caisse claire, charleston et basse selon l'énergie
  effective de la section en cours — de quoi sentir si la structure respire,
  sans avoir à produire de vraies percussions.
- Tête de lecture qui défile, barre d'espace pour lancer/mettre en pause,
  clic sur la règle pour se déplacer.

### Présentation

- **Deux mises en page** selon la largeur d'écran : au-delà de 1000 px, une
  console — colonne de réglages fixe à gauche, sections en lignes denses
  avec aperçu de longueur ; en dessous, les cartes pleine largeur empilées,
  pensées pour le téléphone. Même code, mêmes données, aucun réglage à faire.
- **Deux thèmes** : le thème A sombre (braise, verre mat) et le thème B
  clair et futuriste (bleu électrique, grille fine), au choix en haut de
  page, détecté automatiquement selon la préférence du navigateur au premier
  chargement.
- **Couleurs modifiables** : chaque type de section a son sélecteur de
  couleur, propagée à la frise, aux pastilles, à la grille de mesures et à
  l'impression.

### Projets et export

- **Plusieurs projets** : un carnet de morceaux dans le sélecteur en haut de
  page — nouveau, dupliquer, renommer, supprimer, chacun avec son propre
  genre, sa structure et ses réglages, conservés indépendamment.
- **Exports** : fichier `.json` par projet (réimportable), copie du plan en
  texte, fichier `.txt`, impression / PDF (feuille en noir sur blanc).
- Tout est conservé dans le navigateur, rien n'est envoyé ailleurs.

## Comment la structure est calculée

1. `mesures = durée ÷ (60 ÷ tempo × temps par mesure)` donne la cible en mesures.
2. Le vocabulaire du genre (types de sections, bornes en mesures, noms
   particuliers) est déduit de son modèle de base et de son cycle
   d'extension.
3. Un parcours aléatoire mais guidé choisit la section suivante parmi celles
   éligibles, pondérée par la table de transitions, la fréquence de base du
   type, la nouveauté (favorisée ou non selon la complexité et l'idée de
   morceau) et le goût pour la répétition immédiate (accentué en
   « hypnotique », réduit en « évolutif »).
4. La somme est ajustée sur la cible par phrases entières, en dernier
   recours en dépassant légèrement plutôt que de rester systématiquement
   en dessous.
5. Le résultat est validé (pas d'enchaînement quasi interdit, pas de triple
   répétition d'une section facultative) ; à défaut d'un tirage satisfaisant
   après plusieurs essais, l'application se replie sur un gabarit
   déterministe du genre, pour ne jamais rester sans structure.

## Utilisation

Ouvrir `index.html`, ou publier le dépôt sur GitHub Pages
(workflow `Deploy to GitHub Pages`, à lancer manuellement depuis l'onglet Actions).

## Raccourcis

| Touche | Action |
| --- | --- |
| `Espace` | Lecture / pause |
| `G` | Régénérer la structure |
| `↑` `↓` | Réordonner la section (poignée ⋮⋮ au focus) |
| `Échap` | Fermer la feuille de texte (export bloqué) |
