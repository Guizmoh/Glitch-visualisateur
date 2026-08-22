# Feuille de route — La page noir

Version actuelle : **v2.3** · [Voir l'app](https://guizmoh.github.io/Glitch-visualisateur/)

Les dix améliorations identifiées, classées par **impact réel** (pas par
facilité). Le texte d'analyse d'origine est conservé tel quel pour chaque
point, afin de pouvoir reprendre le travail plus tard sans re-réfléchir au
« pourquoi ».

## Statut en un coup d'œil

| # | Amélioration | Statut |
|---|---|---|
| 1 | Morceaux de référence par style | ✅ v2.1 |
| 2 | Pattern rythmique suggéré | ✅ v2.1 |
| 3 | Export MIDI de la suite d'accords | ⬜ à faire |
| 4 | Lier la gamme au style | ✅ v2.1 |
| 5 | Structure en mesures plutôt qu'en mots | ⬜ à faire |
| 6 | Bouton « Débloque-moi » | ⬜ à faire |
| 7 | Bloc-notes lié à la seed | ⬜ à faire |
| 8 | Ta propre liste de matos | ⬜ à faire |
| 9 | Seed du jour | ⬜ à faire |
| 10 | Liste d'exclusion | ⬜ à faire |

---

## Le gros trou actuel : ça décrit, mais ça ne fait pas entendre

### 1. Morceaux de référence par style — ✅ livré en v2.1

> 2-3 titres réels par style/sous-genre, avec un lien de recherche YouTube. Si
> tu tombes sur "Highlife électronique (tendre)", la description aide, mais 30
> secondes d'écoute te débloquent 10× plus vite. C'est à mon avis
> l'amélioration n°1.

**Ce qui a été fait :** table `REFS` couvrant les 84 styles et sous-genres, 2 à
3 titres chacun. Rendu dans la carte Style en liens de recherche YouTube
(`target="_blank"`, `rel="noopener"`), sans API ni tracking. Sur un mélange
(`House × Techno`), les titres sont pris dans les deux styles. Les références
partent aussi dans l'export `.txt`.

### 2. Un pattern rythmique suggéré — ✅ livré en v2.1

> Une grille 16 pas (kick/snare/hats) typique du style, affichée visuellement.
> Tu passes de "fais du boom bap" à "voilà où tombe la caisse claire".

**Ce qui a été fait :** table `GROOVES` de 27 grilles, chacune sur 16 pas avec
les temps 1-2-3-4 repérés sous la grille. Les noms de pistes s'adaptent au
style (*Skank* en reggae, *Clave* en bossa, *Log drum* en amapiano, *Ride* en
jazz, *808* en trap). Panneau replié par défaut, ouvert en cliquant sur la
banderole. Pour l'ambient et l'expérimental, pas de fausse grille : un message
explique que le rythme vient de la texture.

### 3. Export MIDI de la suite d'accords — ⬜ à faire

> Faisable en pur JS, sans dépendance. Tu glisses le fichier dans ton DAW et tu
> as déjà quelque chose qui joue. Ça transforme l'outil en point de départ
> concret.

**Piste d'implémentation :** écrire les octets d'un fichier MIDI Type 0 à la
main (en-tête `MThd` + piste `MTrk`, delta-times en VLQ), au BPM affiché.

**Points d'attention :**
- Il faut un parseur d'accords pour couvrir tout ce que produit `KEYS` :
  `Cm`, `Ab`, `F#m7`, `Caug`, `Bdim`, `C7(b9)`, `Cdim7`…
- Trois gammes n'ont pas d'accords fixes (microtonalité, chromatique libre, et
  les cas « Libre — … ») : y désactiver le bouton plutôt que produire un
  fichier faux.
- Le téléchargement doit suivre le même chemin que l'export `.txt` existant
  (`Blob` + `URL.createObjectURL`).

---

## Cohérence musicale (bug de conception actuel)

### 4. Lier la gamme au style — ✅ livré en v2.1

> Aujourd'hui la tonalité est tirée indépendamment — tu peux tomber sur "Phonk
> + Lydien" qui n'a pas beaucoup de sens. Pondérer les modes par style
> (phrygien → flamenco/metal, mixolydien → funk, dorien → house/jazz) rendrait
> chaque tirage plus crédible.

**Ce qui a été fait :** 7 familles de tonalités (`KEY_POOLS` : club mineur,
modal sombre, groove modal, chanson majeure, jazz riche, expérimental,
cinématographique) et une table `KEYPOOL_OF` associant chaque style à sa
famille. 80 % des tirages suivent la famille, 20 % restent libres pour garder
des rapprochements inattendus. Mesuré sur 400 tirages : **86,5 %** des gammes
tombent dans la famille du style (80 % dirigés + les tirages libres qui y
retombent par hasard).

### 5. Structure en mesures plutôt qu'en mots — ⬜ à faire

> "Intro 8 mes. → couplet 16 → drop 32" au lieu de "intro atmosphérique →
> montée → chute".

**Points d'attention :**
- Les longueurs doivent dépendre du style : une intro techno n'a pas la même
  durée qu'une intro pop.
- Décider si ça **remplace** `STRUCTURES` ou si ça vient **en complément**
  (une ligne descriptive + une timeline chiffrée). Le complément est sans doute
  plus riche, mais surveiller la hauteur de la carte dans la grille 3×2.

---

## Faire de l'app un outil de séance, pas juste un dé

### 6. Bouton « Débloque-moi » — ⬜ à faire

> Une micro-action unique quand tu bloques ("mute la basse 8 mesures", "pitch
> le sample -5 demi-tons"). Différent d'une contrainte de départ — c'est un
> secours en cours de route.

**Points d'attention :**
- Pool dédié, **distinct** de `CONSTRAINTS` : ce sont des gestes correctifs sur
  un morceau déjà commencé, pas des règles de départ.
- Ne doit pas régénérer l'inspiration en cours ni entrer dans le permalien.
- Bonne place : à côté du chrono, puisque c'est un outil de séance.

### 7. Bloc-notes lié à la seed — ⬜ à faire

> Ce que tu as fait de cette inspiration, sauvegardé avec le favori. Tes favoris
> deviennent un carnet, pas une liste d'idées mortes.

**Points d'attention :**
- Les notes ne doivent **pas** partir dans le permalien : trop volumineux, et
  c'est personnel. À garder en `localStorage`, indexées par seed.
- Prévoir l'affichage de la note dans la liste des favoris (aperçu tronqué) et
  son édition au clic.

### 8. Ta propre liste de matos — ⬜ à faire

> Remplacer les 25 instruments génériques par ce que tu possèdes vraiment.
> Énorme gain d'utilité concrète.

**Points d'attention :**
- Panneau d'édition (une ligne par instrument), stocké en `localStorage`, avec
  la liste `INSTRUMENTS` par défaut en secours si rien n'est renseigné.
- Gérer le cas d'une liste très courte (moins de 3 entrées) : le tirage en
  pioche 3 à la fois.

---

## Inspiration / engagement

### 9. Seed du jour — ⬜ à faire

> Une seed déterministe basée sur la date : tout le monde a la même. Combiné aux
> permaliens que tu as déjà, ça donne un "défi du jour" partageable sans rien
> coder côté serveur.

**Piste d'implémentation :** hacher `YYYY-MM-DD` pour obtenir un générateur
pseudo-aléatoire reproductible (type mulberry32), puis alimenter **tous** les
tirages avec ce générateur au lieu de `Math.random()`.

**Point d'attention :** c'est le chantier le plus intrusif de la liste — il
touche `drawFrom()`, `shuffled()`, le tirage des BPM et celui des accords. À
faire proprement en injectant la source d'aléa, pas en dupliquant le code.

### 10. Liste d'exclusion — ⬜ à faire

> L'inverse des favoris : "ne me redonne plus jamais du Gabber".

**Points d'attention :**
- Doit cohabiter proprement avec les styles préférés : un style ne peut pas
  être dans les deux listes en même temps.
- Décider si l'exclusion porte sur le style parent seul ou aussi sur ses
  sous-genres (probablement les deux, avec exclusion fine possible).
- Vérifier qu'il reste au moins un style tirable après filtrage.

---

## Notes techniques

- Tout tient dans `index.html` : aucune étape de build, aucune dépendance JS
  externe. `manifest.json`, `sw.js` et `icons/` complètent la PWA.
- Le déploiement sur GitHub Pages est **manuel** : workflow `deploy-pages.yml`
  en `workflow_dispatch` uniquement, pour ne pas publier à chaque commit.
- Tous les tirages passent par `drawFrom()` (tirage sans remise) — penser à
  l'utiliser pour tout nouveau pool.
- Les permaliens encodent l'état dans le hash de l'URL. Tout nouveau champ doit
  soit être **dérivable du nom du style** (comme les références et le groove via
  `applyStyleExtras()`), soit être ajouté **en fin** du tableau compact, pour
  que les liens déjà partagés restent valides.
- En cas de changement visible, penser à incrémenter `CACHE_VERSION` dans
  `sw.js` : sans ça, les installations PWA existantes restent sur l'ancienne
  version.
