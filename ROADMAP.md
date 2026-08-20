# Feuille de route — Inspiration musical

Version actuelle : **v1.4.1**

Ce fichier liste les améliorations identifiées mais pas encore faites, pour
pouvoir reprendre le travail plus tard sans tout re-réfléchir. Chaque entrée
garde son numéro d'origine de la discussion.

---

## Livré en v1.4.1

- **[1] Morceaux de référence par style** — 2 à 3 titres réels par style et
  sous-genre (84 entrées au total), affichés dans la carte Style sous la forme
  de liens de recherche YouTube. Aucune API, aucun tracking.
- **[2] Pattern rythmique suggéré** — grille visuelle de 16 pas
  (kick / snare / hats, avec des noms de pistes adaptés au style : skank, clave,
  log drum, ride…), dans un panneau replié par défaut qu'on ouvre en cliquant
  sur la banderole. 27 grooves différents, plus un cas « sans batterie » pour
  l'ambient et l'expérimental.
- **[4] Gamme liée au style** — les modes sont désormais tirés dans une famille
  cohérente avec le style (7 familles : club mineur, modal sombre, modal groove,
  chanson majeure, jazz riche, expérimental, cinématographique). 80 % des
  tirages suivent la famille, 20 % restent libres pour garder de la surprise.

---

## À faire

### [3] Export MIDI de la suite d'accords
Générer un fichier `.mid` en pur JavaScript (pas de dépendance : on écrit les
octets d'un fichier MIDI Type 0 à la main) contenant la progression affichée, au
BPM affiché. L'utilisateur glisse le fichier dans son DAW et a déjà quelque
chose qui joue.

*Point d'attention :* il faut mapper les noms d'accords français/anglais
(`Cm`, `Ab`, `F#m7`, `Caug`, `Bdim`…) vers des notes MIDI — prévoir un parseur
d'accords, et gérer les cas sans accords fixes (microtonalité, chromatique
libre) en désactivant le bouton.

### [5] Structure en mesures plutôt qu'en mots
Remplacer (ou compléter) « Intro atmosphérique → montée → chute » par une
timeline chiffrée : « Intro 8 mes. → couplet 16 → drop 32 ». Les longueurs
devraient dépendre du style (une intro techno n'a pas la même durée qu'une
intro pop).

### [6] Bouton « Débloque-moi »
Une micro-action unique à déclencher **pendant** la séance, quand on bloque —
différent d'une contrainte de départ. Exemples : « mute la basse 8 mesures »,
« pitch le sample -5 demi-tons », « supprime l'élément dont tu es le plus
fier ». Prévoir un pool dédié, distinct de `CONSTRAINTS`.

### [7] Bloc-notes lié à la seed
Un champ de texte libre sauvegardé avec le favori : ce qu'on a fait de cette
inspiration, où en est le morceau. Les favoris deviennent un carnet de bord
plutôt qu'une liste d'idées mortes.

*Point d'attention :* les notes ne doivent pas partir dans le permalien (trop
volumineux, et c'est personnel) — les garder en `localStorage` uniquement,
indexées par seed.

### [8] Liste de matos personnelle
Remplacer les 25 instruments génériques par ce que l'utilisateur possède
vraiment : un panneau d'édition, stocké en `localStorage`, avec la liste par
défaut en secours si rien n'est renseigné.

### [9] Seed du jour
Une seed déterministe dérivée de la date (même seed pour tout le monde le même
jour) : ça donne un « défi du jour » partageable, sans rien coder côté serveur
puisque les permaliens existent déjà.

*Piste :* hacher `YYYY-MM-DD` pour obtenir un générateur pseudo-aléatoire
reproductible, puis alimenter tous les tirages avec ce générateur au lieu de
`Math.random()`.

### [10] Liste d'exclusion
L'inverse des styles préférés : « ne me redonne plus jamais ça ». Utile pour les
genres qu'on ne travaillera jamais. À faire cohabiter proprement avec les styles
préférés (un style ne peut pas être dans les deux).

---

## Notes techniques

- Tout tient dans `index.html` (aucune étape de build, aucune dépendance JS
  externe). `manifest.json`, `sw.js` et `icons/` complètent la PWA.
- Le déploiement sur GitHub Pages est **manuel** : workflow `deploy-pages.yml`
  déclenché en `workflow_dispatch` uniquement, pour ne pas publier à chaque
  commit.
- Les tirages passent tous par `drawFrom()` (tirage sans remise) — penser à
  l'utiliser pour tout nouveau pool.
- Les permaliens encodent l'état dans le hash. Tout nouveau champ doit soit être
  dérivable du nom du style (comme les références et le groove via
  `applyStyleExtras`), soit être ajouté en fin de tableau compact pour rester
  rétrocompatible avec les liens déjà partagés.
