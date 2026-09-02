# Plan de morceau

Application web qui calcule **l'arrangement d'un morceau** : combien de mesures
d'intro, de couplet, de pré-refrain, de refrain, de pont, de solo, d'outro —
en fonction de la **durée visée**, du **tempo**, de la **signature rythmique**
et du **genre musical** choisi.

Une seule page, sans dépendance ni build : `index.html` s'ouvre directement
dans un navigateur.

## Ce que fait l'application

- **18 genres** avec leur modèle de structure : pop, rock, métal, punk, ballade,
  funk/soul, R&B, hip-hop/trap, trip-hop, EDM/house, techno, jazz (AABA),
  blues 12 mesures, reggae, chanson française, folk, ambient, cinématique.
  Chaque genre propose sa durée type, son tempo et sa longueur de phrase :
  l'ambient s'ouvre sur 8 minutes de nappes qui se recouvrent, le cinématique
  sur 3 minutes de paliers (atmosphère, thème, montée, impact, climax, coda),
  le punk sur 2 minutes 15.
- **Adaptation à la durée** : un morceau court perd son pont et ses pré-refrains,
  un morceau long gagne des cycles couplet/refrain (ou un chorus de solo de plus
  en jazz, un break + montée + drop de plus en EDM).
- **Longueurs musicales** : les sections tombent sur des phrases entières
  (4, 8, 12 ou 32 mesures selon le genre). C'est la durée finale qui s'ajuste de
  quelques secondes, jamais l'inverse — l'écart avec la cible est affiché, et
  signalé quand le genre impose des blocs trop longs pour la durée demandée.
- **Frise proportionnelle** avec courbe d'énergie, minutage et numéros de mesures.
- **Grille de mesures** section par section.
- **Lecture** : tête de lecture qui défile et métronome (accent sur le premier
  temps de chaque mesure, accent plus fort à chaque changement de section).
  Barre d'espace pour lancer / mettre en pause, clic sur la règle pour se déplacer.
- **Édition libre** : renommer une section, changer son nombre de mesures,
  la monter, la descendre, la dupliquer, la supprimer, en ajouter une.
- **Deux thèmes** : le thème A sombre (braise, verre mat) et le thème B clair
  et futuriste (bleu électrique, grille fine), au choix en haut de page.
- **Couleurs modifiables** : chaque type de section a son sélecteur de couleur,
  et la teinte choisie se propage à la frise, aux pastilles, à la grille de
  mesures et à l'impression.
- **Exports** : copie du plan en texte, fichier `.txt`, fichier `.json`,
  impression / PDF (feuille en noir sur blanc).
- Les réglages sont conservés dans le navigateur, rien n'est envoyé ailleurs.

## Comment la structure est calculée

1. `mesures = durée ÷ (60 ÷ tempo × temps par mesure)` donne la cible en mesures.
2. On part du modèle du genre. Les sections facultatives disparaissent d'abord
   (pont, puis pré-refrains, puis intro et outro) si le morceau est trop court ;
   des cycles supplémentaires sont insérés s'il est trop long.
3. Chaque section part de son minimum, puis grandit par phrases : d'abord en
   doublant (8 → 16 mesures, comme sonne une vraie structure), ensuite par
   phrases de 4 ou 8 pour approcher la cible.
4. Le reste est arrondi sur une section élastique (refrain, couplet, solo, drop),
   jamais sur l'intro.

## Utilisation

Ouvrir `index.html`, ou publier le dépôt sur GitHub Pages
(workflow `Deploy to GitHub Pages`, à lancer manuellement depuis l'onglet Actions).

## Raccourcis

| Touche | Action |
| --- | --- |
| `Espace` | Lecture / pause |
| `G` | Régénérer la structure |
