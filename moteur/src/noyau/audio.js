/* =========================================================================
   audio.js — Les bruitages et la musique, fabriques par le code.
   Aucun fichier .mp3 a telecharger : on utilise le "synthetiseur" integre
   au navigateur (Web Audio). Pour ajouter un son, ajoute une recette dans
   SONS plus bas.
   ========================================================================= */

/** Recettes de bruitages. forme : 'square' (retro), 'sine' (doux), 'sawtooth', 'triangle'. */
export const SONS = {
  epee: { forme: 'square', de: 620, vers: 240, duree: 0.12, volume: 0.25 },
  coup: { forme: 'square', de: 200, vers: 60, duree: 0.16, volume: 0.3, bruit: true },
  degat: { forme: 'sawtooth', de: 320, vers: 90, duree: 0.28, volume: 0.32 },
  mort: { forme: 'sawtooth', de: 420, vers: 40, duree: 0.6, volume: 0.3 },
  rubis: { forme: 'square', de: 900, vers: 1400, duree: 0.1, volume: 0.18 },
  coeur: { forme: 'triangle', de: 700, vers: 1300, duree: 0.22, volume: 0.25 },
  cle: { forme: 'square', de: 1000, vers: 1600, duree: 0.18, volume: 0.2 },
  coffre: { forme: 'triangle', de: 300, vers: 900, duree: 0.45, volume: 0.28 },
  porte: { forme: 'square', de: 160, vers: 320, duree: 0.25, volume: 0.22 },
  secret: { forme: 'triangle', de: 520, vers: 1040, duree: 0.5, volume: 0.3 },
  bombe: { forme: 'sawtooth', de: 180, vers: 30, duree: 0.5, volume: 0.35, bruit: true },
  tir: { forme: 'square', de: 800, vers: 500, duree: 0.09, volume: 0.16 },
  pas: { forme: 'triangle', de: 120, vers: 90, duree: 0.05, volume: 0.08 },
  menu: { forme: 'square', de: 520, vers: 760, duree: 0.07, volume: 0.15 },
  erreur: { forme: 'square', de: 200, vers: 140, duree: 0.18, volume: 0.2 },
  pousser: { forme: 'triangle', de: 90, vers: 70, duree: 0.2, volume: 0.15, bruit: true },
  bloc: { forme: 'square', de: 140, vers: 220, duree: 0.12, volume: 0.18 },
};

/** Notes de musique (frequences en Hz). */
const NOTES = {
  do: 261.63, do4: 261.63, re: 293.66, mi: 329.63, fa: 349.23, sol: 392.0,
  la: 440.0, si: 493.88, do5: 523.25, re5: 587.33, mi5: 659.25, fa5: 698.46,
  sol5: 783.99, la5: 880.0, si5: 987.77, do6: 1046.5,
  do3: 130.81, re3: 146.83, mi3: 164.81, fa3: 174.61, sol3: 196.0, la3: 220.0, si3: 246.94,
  silence: 0,
};

export class Audio {
  constructor() {
    this.contexte = null;
    this.volumeGeneral = 0.6;
    this.muet = false;
    this.musiqueEnCours = null;
    this.minuteurMusique = null;
  }

  /** Les navigateurs exigent un clic/une touche avant de jouer du son. */
  reveiller() {
    if (!this.contexte) {
      const Contexte = window.AudioContext || window.webkitAudioContext;
      if (!Contexte) return;
      this.contexte = new Contexte();
    }
    if (this.contexte.state === 'suspended') this.contexte.resume();
  }

  /** Joue un bruitage : audio.jouer('epee') */
  jouer(nom, variationHauteur = 1) {
    if (this.muet || !this.contexte) return;
    const recette = SONS[nom];
    if (!recette) return;
    const t = this.contexte.currentTime;
    const gain = this.contexte.createGain();
    const volume = (recette.volume || 0.2) * this.volumeGeneral;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + recette.duree);
    gain.connect(this.contexte.destination);

    const osc = this.contexte.createOscillator();
    osc.type = recette.forme || 'square';
    osc.frequency.setValueAtTime(recette.de * variationHauteur, t);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, recette.vers * variationHauteur),
      t + recette.duree
    );
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + recette.duree + 0.02);

    if (recette.bruit) this._souffle(recette.duree, volume * 0.6);
  }

  /** Un petit "pshhh" de bruit blanc (explosions, coups sourds). */
  _souffle(duree, volume) {
    const taille = Math.floor(this.contexte.sampleRate * duree);
    const tampon = this.contexte.createBuffer(1, taille, this.contexte.sampleRate);
    const donnees = tampon.getChannelData(0);
    for (let i = 0; i < taille; i++) {
      donnees[i] = (Math.random() * 2 - 1) * (1 - i / taille);
    }
    const source = this.contexte.createBufferSource();
    source.buffer = tampon;
    const gain = this.contexte.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(this.contexte.destination);
    source.start();
  }

  /** Joue une note unique (utilise par la musique). */
  note(frequence, duree, volume = 0.12, forme = 'square', decalage = 0) {
    if (this.muet || !this.contexte || !frequence) return;
    const t = this.contexte.currentTime + decalage;
    const gain = this.contexte.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume * this.volumeGeneral, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    const osc = this.contexte.createOscillator();
    osc.type = forme;
    osc.frequency.setValueAtTime(frequence, t);
    osc.connect(gain).connect(this.contexte.destination);
    osc.start(t);
    osc.stop(t + duree + 0.02);
  }

  /**
   * Joue une musique en boucle.
   * melodie : liste de ['nom-de-note', duree-en-temps]
   * Exemple : [['do',1], ['mi',1], ['sol',2]]
   */
  jouerMusique(melodie, { tempo = 120, forme = 'square', volume = 0.08, basse = true } = {}) {
    this.arreterMusique();
    if (!this.contexte || this.muet) return;
    const dureeTemps = 60 / tempo;
    let index = 0;
    const jouerSuivante = () => {
      if (!this.musiqueEnCours) return;
      const [nom, temps] = melodie[index % melodie.length];
      const duree = temps * dureeTemps;
      this.note(NOTES[nom] ?? 0, duree * 0.9, volume, forme);
      if (basse && index % 2 === 0) {
        const grave = (NOTES[nom] ?? 0) / 4;
        this.note(grave, duree * 0.9, volume * 0.7, 'triangle');
      }
      index++;
      this.minuteurMusique = setTimeout(jouerSuivante, duree * 1000);
    };
    this.musiqueEnCours = melodie;
    jouerSuivante();
  }

  arreterMusique() {
    this.musiqueEnCours = null;
    if (this.minuteurMusique) clearTimeout(this.minuteurMusique);
    this.minuteurMusique = null;
  }

  basculerMuet() {
    this.muet = !this.muet;
    if (this.muet) this.arreterMusique();
    return this.muet;
  }
}

/** L'audio partage par tout le jeu. */
export const audio = new Audio();
