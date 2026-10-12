# Idées à prendre du Dirtywave M8 et du Polyend Tracker

Ce sont des **propositions** : rien n'est appliqué tant que tu ne dis pas oui. Pour chaque idée, tu trouveras :
- ce que c'est ;
- ce que ça apporterait à KAWA ;
- ce que ça coûterait sur le FM-1, en CPU, en mémoire et en complexité.

## Déjà dans KAWA 0.2 (inspiré de ces machines)

| Idée | M8 / Polyend | Dans KAWA |
|---|---|---|
| Effets par case (arpège, glissé, retrig, chance, délai, coupe…) | commandes du M8, FX de pas du Polyend | 15 « effets de case » : ARP, GLI, VIB, ROL, BND, CHN, DLY, CUT, REV, PIT, SHP, CRU, VSL, PAN, OFS |
| Performance en direct | mode Performance du Polyend | 32 effets live (FX tenu), sur le master ou une piste, enregistrables |
| Génération / remplissage de motifs | Fill / Randomise du Polyend | 16 outils MAGIE (beat, mélodie, basse, euclide, varier, roulements…) |
| Chaînes de motifs répétés | song / chains du M8 | CHAINE : chaque motif joué N fois |
| Clonage | clone du M8 | outil CLONER : copie dans un motif libre et l'ajoute à la chaîne |
| Moteur FM éditable | FM synth du M8 | piste FM : 6 opérateurs, 32 algorithmes |
| Découpe de samples | Slicer du Polyend | moteur SAMPLE en tranches + outil HACHOIR |
| Horloge MIDI | les deux | sortie d'horloge MIDI (OPTIONS) |

## Propositions

### 1. Tables (M8) ★★★
Une table est une petite liste de 16 pas, attachée à un son, qui s'exécute à chaque note. Chaque pas peut changer la hauteur, le volume ou un effet, à la vitesse choisie.
- **Ce que ça apporte :** des arpèges, des « drums » chiptune, des sons qui évoluent, sans remplir le motif. C'est la vraie force des trackers 8-bit.
- **Coût sur le FM-1 :** faible en CPU (un pas tous les quelques ms) et environ 1 Ko par projet. Il faut une nouvelle page TABLE.
- **Avis :** fortement conseillé.

### 2. Tables de groove (M8) ★★
Au lieu d'un seul swing, une liste de durées de lignes, par exemple 6-4-5-5, pour des grooves humains ou « drunk ».
- **Coût :** quasi nul.
- **Avis :** conseillé, c'est très breakcore et hip-hop.

### 3. Mode Live / lanceur de chaînes (M8) ★★
Une page où chaque piste lance sa propre chaîne en boucle, en direct, comme un lanceur de clips. On construit le morceau en jouant.
- **Coût :** moyen, car il faut une page et des séquenceurs par piste. Le CPU ne change pas.
- **Avis :** idéal pour le live, à faire après les tables.

### 4. Deuxième colonne d'effet par case (Polyend) ★★
Deux effets dans la même case, par exemple ROL + PIT.
- **Coût :** +6 Ko de projet (les 32 motifs grossissent) et une case plus large à l'écran.
- **Avis :** utile, mais l'écran de 240 px devient chargé. On peut afficher la 2e colonne seulement sur la piste sélectionnée.

### 5. Commandes de saut (M8 HOP, Polyend) ★
Sauter à une ligne, ou finir le motif plus tôt, depuis une case.
- **Coût :** quasi nul.
- **Avis :** pratique pour les fills et les motifs de longueur variable.

### 6. Rééchantillonnage / bounce (M8, Polyend) ★★
Enregistrer la sortie master, ou une piste, dans un emplacement MON 1-4, puis la redécouper.
- **Coût :** il faut écrire la flash pendant ou après la lecture. L'écriture coupe le son environ 50 ms par secteur : c'est possible seulement après coup, à l'arrêt, depuis un tampon en RAM. La RAM libre limite à environ 1 s.
- **Avis :** très « breakcore » ; à étudier après des tests sur le vrai FM-1.

### 7. Éditeur de sample (Polyend) ★
Couper le début et la fin, normaliser, inverser, et placer les tranches à la main.
- **Coût :** moyen (une page). Les données restent en flash.
- **Avis :** utile quand l'import de sons sera validé sur la machine.

### 8. Interpolation de valeurs (M8, Polyend) ★
Remplir une rampe de volume ou d'une valeur d'effet entre deux cases.
- **Coût :** nul.
- **Avis :** facile à ajouter comme outil MAGIE, à la place d'un outil moins utile.

### 9. Instrument MIDI (M8) ★★
Une piste qui joue un synthé externe par USB-MIDI : notes, vélocité et CC dans les effets de case.
- **Coût :** faible.
- **Avis :** très demandé sur les grooveboxes ; il complète l'horloge MIDI déjà ajoutée.

### 10. Entrée d'horloge MIDI (synchro esclave) ★★
Suivre le tempo d'une autre machine ou d'un DAW.
- **Coût :** moyen. Il faut lisser le tempo reçu, et c'est délicat avec le swing.
- **Avis :** à faire avec le n° 9.

## Ce que je déconseille sur le FM-1

- **Plus de pistes FM, ou un « hypersynth » polyphonique** : le budget CPU de l'interruption audio ne le permet pas sans risque (voir l'étude CPU).
- **Le sampling depuis l'entrée micro ou ligne** : le FM-1 n'a pas d'entrée audio exploitée par la plateforme.

Dis-moi lesquelles tu veux, et dans quel ordre : je les ajoute ensuite.
