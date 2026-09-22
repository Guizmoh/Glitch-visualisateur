/* =========================================================================
   dialogues.js — TOUT CE QUE DISENT LES PERSONNAGES.
   Une fiche par personnage. Chaque texte entre guillemets = une "page"
   (le joueur appuie sur ESPACE pour lire la suite).

   Les "variantes" permettent de dire autre chose selon la situation :
   la premiere variante dont la condition "si" est vraie gagne.
   ========================================================================= */

export const DIALOGUES = {
  sage: {
    titre: 'Vieux sage',
    variantes: [
      {
        // Quand le heros n'a pas encore d'epee, le sage la lui donne.
        si: ({ inventaire }) => !inventaire.possede('epee'),
        pages: [
          'Ah, te voila enfin !',
          'Des monstres ont vole les trois FRAGMENTS DE LUMIERE du village.',
          'Prends cette epee, jeune heros. Tu en auras besoin...',
        ],
        apres: ({ inventaire, scene }) => {
          inventaire.donner('epee');
          scene.montrerObjetTrouve('epee', 'Tu as recu l\'EPEE DE BOIS !');
        },
      },
      {
        si: ({ drapeau }) => drapeau('boss-vaincu'),
        pages: [
          'Tu as vaincu le Roi Gluant ! Le village est sauve.',
          'Tu es un vrai heros. Bravo !',
        ],
      },
      {
        // Variante par defaut
        pages: [
          'La grotte a l\'est mene au donjon.',
          'Coupe les buissons avec ton epee : ils cachent parfois des rubis.',
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
          'Bonjour ! Fais attention aux gluants, ils rebondissent.',
          'On dit qu\'un tresor est cache derriere les rochers.',
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
