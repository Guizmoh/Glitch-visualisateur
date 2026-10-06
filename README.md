# Pages de Guizmoh

Branche dédiée à la publication GitHub Pages : elle ne contient pas de code
source à modifier, seulement le résultat déployé de deux applications
indépendantes, chacune installable séparément sur mobile (Ajouter à l'écran
d'accueil / Installer l'application).

- [`plan-de-morceau/`](plan-de-morceau/) — généré depuis la branche
  `claude/music-arrangement-app-4llo35`.
- [`page-noir/`](page-noir/) — généré depuis la branche
  `claude/inspiration-musicale-6kua9g`.

`index.html` à la racine n'est qu'une page d'accueil qui pointe vers les deux.

## Mettre à jour une des deux applications

Republier le contenu du dossier correspondant depuis sa branche source, puis
relancer le workflow **Deploy to GitHub Pages** (onglet Actions, « Run
workflow » sur cette branche-ci, `pages-site`).

Ne pas développer directement ici : les deux applications gardent leur
propre branche de travail.
