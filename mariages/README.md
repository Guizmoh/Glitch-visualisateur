# Carnet de mariages

Une application d'une seule page pour gérer un carnet de commandes de mariages :
demandes, devis, lieux, contacts, argent, heures passées et échéances.

Ouvrir `index.html` dans un navigateur suffit — aucune installation, aucun serveur.

## Ce que fait l'application

**Ajout éclair.** Une ligne de texte libre suffit à créer une fiche complète :

```
Camille & Théo · 13/06/2026 · Château de Rambures · 06 12 34 56 78 · 3400 € · 120 invités
```

Prénoms, date (12 formats acceptés : `13/06/2026`, `13 juin 2026`, `samedi 30 mai`…),
lieu, téléphone, e-mail, prix, code postal et nombre d'invités sont reconnus et
affichés avant validation.

**Automatismes.** Acompte calculé au pourcentage, solde et date limite, échéancier
de tâches généré depuis la date du mariage, adresse d'un lieu déjà connu reprise
automatiquement, détection des doublons de date, relances signalées toutes seules,
statut et dates de suivi mis à jour quand on encaisse un acompte ou qu'on envoie un devis.

**Calculs.** Un onglet *Tableau* trie toutes les colonnes et affiche en bas une barre
de totaux (chiffre d'affaires, frais, bénéfice, heures, € par heure, panier moyen)
sur les lignes affichées ou sur les seules lignes cochées. Un onglet *Analyse*
recalcule tout sur une période (année, douze derniers mois, dates personnalisées)
avec répartition par mois, par lieu, par source, par ville et par formule.

**Exports.** CSV pour tableur, sauvegarde JSON complète et restauration.

## Stockage

L'application choisit automatiquement :

- **en ligne** quand elle tourne comme page publiée sur claude.ai (données partagées
  entre appareils, synchronisées en direct) ;
- **dans le navigateur** sinon (`localStorage`), avec export de sauvegarde recommandé.

## Gmail et Google Agenda

Dans la version publiée sur claude.ai uniquement, chaque fiche peut :

- créer un brouillon Gmail (devis, relance, confirmation, réclamation du solde)
  à partir de modèles modifiables dans les réglages ;
- retrouver les échanges déjà eus avec le couple ;
- créer l'évènement du mariage et ses échéances dans Google Agenda ;
- vérifier si la date est déjà occupée dans l'agenda.

Ces fonctions demandent que les connecteurs Gmail et Google Calendar soient
connectés dans claude.ai → Paramètres → Connecteurs. Hors de ce contexte, les
boutons expliquent simplement qu'ils ne sont pas disponibles.

## Version publiée

Le fichier publié sur claude.ai est le même, privé de son enveloppe de document
(la plateforme la fournit). Pour le régénérer, garder les lignes comprises entre
`<title>` et `</body>` en retirant `</head>` et `<body>`.
