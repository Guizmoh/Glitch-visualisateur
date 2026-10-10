/* =========================================================================
   musiques.js — LES MUSIQUES, ecrites comme des partitions.
   Chaque case est ['nom-de-note', duree]. Les notes possibles :
   do re mi fa sol la si (octave normale), do5 re5 mi5... (aigu),
   do3 re3 mi3... (grave), et 'silence' pour un blanc.
   ========================================================================= */

export const MUSIQUES = {
  titre: {
    options: { tempo: 108, forme: 'triangle', volume: 0.07 },
    notes: [
      ['do5', 1], ['mi5', 1], ['sol5', 2],
      ['fa5', 1], ['mi5', 1], ['re5', 2],
      ['do5', 1], ['re5', 1], ['mi5', 2],
      ['sol', 2], ['silence', 2],
    ],
  },

  village: {
    options: { tempo: 132, forme: 'square', volume: 0.05 },
    notes: [
      ['do5', 1], ['mi5', 1], ['sol5', 1], ['mi5', 1],
      ['fa5', 1], ['la5', 1], ['sol5', 2],
      ['re5', 1], ['fa5', 1], ['la5', 1], ['fa5', 1],
      ['mi5', 1], ['do5', 1], ['re5', 2],
    ],
  },

  foret: {
    options: { tempo: 116, forme: 'triangle', volume: 0.05 },
    notes: [
      ['la', 2], ['do5', 1], ['mi5', 1],
      ['re5', 2], ['si', 2],
      ['do5', 2], ['mi5', 1], ['sol5', 1],
      ['mi5', 2], ['silence', 2],
    ],
  },

  donjon: {
    options: { tempo: 96, forme: 'square', volume: 0.05 },
    notes: [
      ['la3', 2], ['do', 1], ['mi', 1],
      ['re', 2], ['la3', 2],
      ['sol3', 2], ['si3', 1], ['re', 1],
      ['do', 2], ['la3', 2],
    ],
  },

  boss: {
    options: { tempo: 152, forme: 'sawtooth', volume: 0.05 },
    notes: [
      ['la3', 1], ['la3', 1], ['do', 1], ['la3', 1],
      ['re', 1], ['do', 1], ['la3', 2],
      ['sol3', 1], ['sol3', 1], ['si3', 1], ['sol3', 1],
      ['do', 1], ['si3', 1], ['sol3', 2],
    ],
  },

  victoire: {
    options: { tempo: 140, forme: 'square', volume: 0.08 },
    notes: [
      ['do5', 1], ['do5', 1], ['do5', 1], ['do5', 2],
      ['sol', 2], ['la', 2], ['do5', 2],
      ['si', 1], ['do5', 4], ['silence', 2],
    ],
  },

  defaite: {
    options: { tempo: 76, forme: 'triangle', volume: 0.07 },
    notes: [
      ['do5', 1], ['si', 1], ['la', 1], ['sol', 3],
      ['mi', 2], ['do', 4], ['silence', 4],
    ],
  },
};
