/* =========================================================================
   objets.js — TOUS LES OBJETS DU JEU.
   Pour inventer un objet : copie une ligne, change le nom et le dessin.

   - "ramasser" est appele quand le heros touche l'objet par terre.
   - "permanent: true" = l'objet rentre dans l'inventaire pour toujours
     (epee, arc, bouclier...) et declenche la petite fanfare.
   - "utiliser" est appele quand le joueur appuie sur la touche OBJET.
   ========================================================================= */

export const OBJETS = {
  /* --- Ramassables : ils apparaissent par terre ------------------- */
  coeur: {
    nom: 'Coeur', sprite: 'coeur', son: 'coeur',
    ramasser: ({ joueur }) => joueur.soigner(2),
  },
  demi_coeur: {
    nom: 'Demi-coeur', sprite: 'coeur', son: 'coeur', echelle: 0.7,
    ramasser: ({ joueur }) => joueur.soigner(1),
  },
  rubis: {
    nom: 'Rubis', sprite: 'rubis', son: 'rubis',
    ramasser: ({ inventaire }) => inventaire.ajouter('rubis', 1),
  },
  rubis_bleu: {
    nom: 'Rubis bleu', sprite: 'rubis', son: 'rubis', teinte: '#4a90d9',
    ramasser: ({ inventaire }) => inventaire.ajouter('rubis', 5),
  },
  rubis_rouge: {
    nom: 'Rubis rouge', sprite: 'rubis', son: 'rubis', teinte: '#e04a4a',
    ramasser: ({ inventaire }) => inventaire.ajouter('rubis', 20),
  },
  cle: {
    nom: 'Petite cle', sprite: 'cle', son: 'cle',
    ramasser: ({ inventaire }) => inventaire.ajouter('cles', 1),
  },
  munition_bombe: {
    nom: 'Bombe', sprite: 'bombe', son: 'cle',
    ramasser: ({ inventaire }) => inventaire.ajouter('bombes', 3),
  },
  munition_fleche: {
    nom: 'Fleches', sprite: 'fleche', son: 'cle',
    ramasser: ({ inventaire }) => inventaire.ajouter('fleches', 5),
  },
  potion: {
    nom: 'Potion', sprite: 'potion', son: 'coeur',
    ramasser: ({ joueur }) => joueur.soigner(joueur.pvMax),
  },

  /* --- Objets permanents : les grandes trouvailles ----------------- */
  epee: {
    nom: 'Epee de bois', sprite: 'icone_epee', permanent: true, son: 'secret',
    message: 'Tu as trouve l\'EPEE ! Appuie sur ESPACE pour frapper.',
  },
  bouclier: {
    nom: 'Bouclier', sprite: 'icone_bouclier', permanent: true, son: 'secret',
    message: 'Un BOUCLIER ! Il arrete les fleches quand tu regardes dans leur direction.',
  },
  arc: {
    nom: 'Arc', sprite: 'icone_arc', permanent: true, son: 'secret', equipable: true,
    message: 'Un ARC ! Appuie sur C pour tirer une fleche.',
    utiliser: ({ joueur, scene }) => joueur.tirerFleche(scene),
    munition: 'fleches',
  },
  bombes: {
    nom: 'Sac de bombes', sprite: 'bombe', permanent: true, son: 'secret', equipable: true,
    message: 'Des BOMBES ! Elles ouvrent les rochers fissures.',
    utiliser: ({ joueur, scene }) => joueur.poserBombe(scene),
    munition: 'bombes',
  },
  palmes: {
    nom: 'Palmes', sprite: 'potion', permanent: true, son: 'secret',
    message: 'Des PALMES ! Tu peux maintenant nager dans l\'eau.',
  },
  cle_boss: {
    nom: 'Cle du boss', sprite: 'cle_boss', permanent: true, son: 'secret',
    message: 'La CLE DU BOSS ! La grande porte violette s\'ouvre maintenant.',
  },
  coeur_max: {
    nom: 'Receptacle de coeur', sprite: 'coeur', permanent: true, son: 'secret', echelle: 1.4,
    message: 'Un RECEPTACLE DE COEUR ! Ta vie maximum augmente.',
    ramasser: ({ joueur }) => {
      joueur.pvMax += 2;
      joueur.pv = joueur.pvMax;
    },
  },
  fragment: {
    nom: 'Fragment de lumiere', sprite: 'etincelle', permanent: true, son: 'secret',
    message: 'Un FRAGMENT DE LUMIERE ! Il en faut trois pour sauver le village.',
    compteur: true,
  },
};

/** Ce que laissent tomber les ennemis quand ils meurent (butin par defaut). */
export const BUTIN_PAR_DEFAUT = [
  { objet: 'coeur', chance: 0.25 },
  { objet: 'rubis', chance: 0.35 },
  { objet: 'munition_bombe', chance: 0.06 },
  { objet: 'munition_fleche', chance: 0.08 },
];
