# Applications de Guizmoh

Branche `main` : c'est elle qui est publiée sur GitHub Pages, à l'adresse
https://guizmoh.github.io/Glitch-visualisateur/

Chaque application est dans son propre dossier et garde sa branche de travail.
Ici, on ne fait que rassembler la dernière version de chacune.

| Dossier | Application | Branche de travail |
| --- | --- | --- |
| [`page-noir/`](page-noir/) | Page noir, inspiration musicale | `claude/inspiration-musicale-6kua9g` |
| [`atelier-rythme/`](atelier-rythme/) | Atelier rythme & mélodie | `ccr-015edbb0-iznl6d` |
| [`plan-de-morceau/`](plan-de-morceau/) | Plan de morceau | `claude/music-arrangement-app-4llo35` (version PWA : `pages-site`) |
| [`midi/`](midi/) | Fiches MIDI (fichier `midi.html` de la branche) | `claude/midi-controller-mapping-tool-djr5gc` |
| [`visualisateur/`](visualisateur/) | Glitch, visualisateur | `claude/visualisateur-rendu-yiwotw` |
| [`moteur/`](moteur/) | La Légende de Night (jeu Zelda-like) | `claude/busy-bohr-bei1po` |
| [`mariages/`](mariages/) | Carnet de mariages | `claude/friendly-planck-1tqdoy` |

`index.html` à la racine est la page d'accueil qui pointe vers toutes les applications.

Le Studio Omnipotard (vidéo, sur PC) n'est pas ici : il vit dans le dépôt
`Guizmoh/Omnipotard-HARDWARE-VISUEL`, que `Mettre-a-jour.bat` télécharge.

## Mettre à jour une application

1. Copier la nouvelle version du dossier depuis sa branche de travail vers `main`.
2. Pousser sur `main` : le workflow **Deploy to GitHub Pages** republie le site tout seul.
