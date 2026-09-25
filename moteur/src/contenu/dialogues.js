/* =========================================================================
   dialogues.js — TOUT CE QUE DISENT LES PERSONNAGES.
   Une fiche par personnage. Chaque texte entre guillemets = une "page"
   (le joueur appuie sur ESPACE pour lire la suite).

   Les "variantes" permettent de dire autre chose selon la situation :
   la premiere variante dont la condition "si" est vraie gagne.
   ========================================================================= */

export const DIALOGUES = {
  /* --------------------------------------------------------------------
     PYPA — le vieux magicien, mentor de Night.
     Son secret (il est son grand-pere) ne sera revele qu'a la toute fin :
     ici, il en sait beaucoup trop et n'en dit presque rien. Voir SCENARIO.md.
     -------------------------------------------------------------------- */
  pypa: {
    titre: 'Pypa',
    variantes: [
      {
        // Premiere rencontre : Night sort de la maison, sans rien comprendre.
        si: ({ inventaire }) => !inventaire.possede('epee'),
        pages: [
          'Night. Tu es debout.',
          'Ne force pas pour te souvenir. Ca ne sert a rien, et ca fait mal.',
          'Tiens. Prends cette vieille epee, et ne t\'eloigne pas trop du village.',
        ],
        apres: ({ inventaire, scene }) => {
          inventaire.donner('epee');
          scene.montrerObjetTrouve('epee', 'Tu as recu une VIEILLE EPEE.');
        },
      },
      {
        // Apres le boss : il en lache un peu plus.
        si: ({ drapeau }) => drapeau('boss-vaincu'),
        pages: [
          'Tu l\'as vaincue. C\'est bien.',
          'Mais cette creature n\'etait qu\'un outil, Night.',
          'Celui qui s\'en servait s\'appelle Darkness.',
          'Et c\'est lui qui t\'a pris tes souvenirs.',
          '... Nous en reparlerons. Pas aujourd\'hui.',
        ],
      },
      {
        pages: [
          'Le bois, au nord. La plaine, a l\'est. Le donjon, derriere.',
          'Coupe les buissons : les gens y perdent des choses.',
          'Et Night... si tu vois des traces enormes quelque part, ne les suis pas.',
        ],
      },
    ],
  },


  villageois: {
    titre: 'Villageois',
    variantes: [
      {
        si: ({ inventaire }) => inventaire.possede('bombes'),
        pages: ['Avec des bombes, on peut faire sauter les rochers fissures !'],
      },
      {
        pages: [
          'Night ! On te croyait... enfin. On est content de te voir debout.',
          'Ta maison... personne n\'a rien entendu, cette nuit-la. Personne.',
          'Va voir Pypa. Il attend devant la place depuis ce matin.',
        ],
      },
    ],
  },

  marchande: {
    titre: 'Marchande',
    variantes: [
      {
        si: ({ inventaire }) => inventaire.possede('bouclier'),
        pages: ['Ton bouclier te va tres bien !'],
      },
      {
        si: ({ inventaire }) => inventaire.rubis >= 10,
        pages: [
          'Un bouclier tout neuf pour 10 rubis ?',
          'Vendu ! Tiens, il est a toi.',
        ],
        apres: ({ inventaire, scene }) => {
          inventaire.depenser('rubis', 10);
          inventaire.donner('bouclier');
          scene.montrerObjetTrouve('bouclier', 'Tu as achete le BOUCLIER !');
        },
      },
      {
        pages: ['Je vends un bouclier pour 10 rubis. Reviens quand tu les auras !'],
      },
    ],
  },

  gardien: {
    titre: 'Gardien',
    variantes: [
      {
        si: ({ drapeau }) => drapeau('boss-vaincu'),
        pages: ['Le donjon est calme, maintenant. Merci a toi.'],
      },
      {
        pages: [
          'N\'entre pas dans le donjon sans epee, petit.',
          'Les grilles s\'ouvrent quand on bat tous les monstres d\'une salle.',
        ],
      },
    ],
  },
};
