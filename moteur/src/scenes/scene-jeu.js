/* =========================================================================
   scene-jeu.js — LA PARTIE.
   C'est le chef d'orchestre : il charge les salles, fait vivre les entites,
   gere les transitions, la sauvegarde, la mort du heros...
   ========================================================================= */

import { Scene } from '../noyau/scene.js';
import { Camera } from '../noyau/rendu.js';
import { SystemeParticules } from '../noyau/particules.js';
import { ListeAttentes } from '../noyau/minuteur.js';
import { Sauvegarde } from '../noyau/sauvegarde.js';
import { creerCanvas } from '../noyau/pixels.js';
import { evenements } from '../noyau/evenements.js';

import { Carte, TAILLE_TUILE } from '../monde/carte.js';
import { Joueur } from '../jeu/joueur.js';
import { Inventaire } from '../jeu/inventaire.js';
import { creerEntite } from '../jeu/fabrique.js';
import { Dalle, Cristal, PorteVerrouillee } from '../jeu/interactifs.js';
import { butinRapide } from '../jeu/ramassable.js';

import { BoiteDialogue } from '../ui/dialogue.js';
import { HUD } from '../ui/hud.js';
import { Fondu } from '../ui/transitions.js';

import { CARTES } from '../contenu/cartes.js';
import { CONFIG } from '../contenu/config.js';
import { MUSIQUES } from '../contenu/musiques.js';
import { texte, boite } from '../noyau/rendu.js';

const OPPOSES = { nord: 'sud', sud: 'nord', est: 'ouest', ouest: 'est' };

export class SceneJeu extends Scene {
  constructor(options = {}) {
    super('jeu');
    this.optionsDepart = options;
    this.temps = 0;
  }

  entrer(donnees = {}) {
    const largeur = this.moteur.ecran.largeur;
    const hauteur = this.moteur.ecran.hauteur;

    this.atlas = this.moteur.atlas;
    this.audio = this.moteur.audio;
    this.camera = new Camera(largeur, hauteur);
    this.particules = new SystemeParticules();
    this.attentes = new ListeAttentes();
    this.dialogue = new BoiteDialogue(largeur, hauteur);
    this.hud = new HUD(largeur);
    this.fondu = new Fondu(largeur, hauteur);
    this.inventaire = new Inventaire();
    this.drapeaux = new Set();
    this.entites = [];
    this.aAjouter = [];
    this.transition = null;
    this.objetTrouve = null;
    this.tempsMort = 0;
    this.musiqueActuelle = null;

    this.joueur = new Joueur({ x: CONFIG.positionDepart.x, y: CONFIG.positionDepart.y });

    const sauvegarde = donnees.charger ? Sauvegarde.lire('partie') : null;
    if (sauvegarde) {
      this.chargerDepuis(sauvegarde);
    } else {
      this.chargerSalle(donnees.salle || this.optionsDepart.salle || CONFIG.salleDepart);
      this.joueur.x = CONFIG.positionDepart.x;
      this.joueur.y = CONFIG.positionDepart.y;
    }
    this.camera.suivre(this.joueur, this.carte, true);

    // Quand le heros obtient l'objet final, la partie est gagnee.
    this.victoireEnAttente = false;
    this._arretEcoute = evenements.sur('objet-obtenu', ({ objet }) => {
      if (objet === CONFIG.objetDeVictoire) this.victoireEnAttente = true;
    });
  }

  sortir() {
    this.audio.arreterMusique();
    if (this._arretEcoute) this._arretEcoute();
  }

  /* =================================================================== */
  /* CHARGEMENT DES SALLES                                               */
  /* =================================================================== */

  chargerSalle(nom, options = {}) {
    const donnees = CARTES[nom];
    if (!donnees) {
      console.error(`Salle inconnue : "${nom}"`);
      return;
    }
    this.carte = new Carte({ ...donnees, nom });
    this.entites = [];
    this.aAjouter = [];
    this.particules.vider();

    // 1. Les portes deja ouvertes le restent.
    this.appliquerDrapeauxCarte();

    // 2. Les entites ecrites dans la carte.
    for (const ligne of donnees.entites || []) {
      if (ligne.siDrapeau && !this.drapeauLeve(ligne.siDrapeau)) continue;
      if (ligne.sansDrapeau && this.drapeauLeve(ligne.sansDrapeau)) continue;
      if (ligne.drapeau && ligne.type === 'ennemi' && this.drapeauLeve(ligne.drapeau)) continue;
      const entite = creerEntite(ligne);
      if (!entite) continue;
      if (entite.type === 'coffre' && entite.drapeau && this.drapeauLeve(entite.drapeau)) {
        entite.marquerOuvert();
      }
      this.entites.push(entite);
    }

    // 3. Les passages (escaliers, grottes).
    for (const passage of donnees.passages || []) {
      const entite = creerEntite({ type: 'passage', ...passage });
      if (entite) this.entites.push(entite);
    }

    // 4. Les entites automatiques liees aux tuiles (portes, dalles, cristaux).
    this.creerEntitesDeTuiles();

    // 5. Le heros
    this.entites.push(this.joueur);
    this.joueur.dernierePositionSure = { x: this.joueur.x, y: this.joueur.y };

    this.hud.annoncerSalle(this.carte.titre || '');
    this.lancerMusique(donnees.musique);
    evenements.emettre('salle-chargee', { nom, scene: this });
  }

  /** Cree automatiquement les objets qui correspondent a certaines lettres. */
  creerEntitesDeTuiles() {
    for (let ligne = 0; ligne < this.carte.hauteur; ligne++) {
      for (let col = 0; col < this.carte.largeur; col++) {
        const tuile = this.carte.tuile(col, ligne);
        if (!tuile || !tuile.role) continue;
        const x = col * TAILLE_TUILE;
        const y = ligne * TAILLE_TUILE;
        switch (tuile.role) {
          case 'porte':
          case 'porte_boss':
            this.entites.push(new PorteVerrouillee({
              x, y, col, ligne,
              boss: tuile.role === 'porte_boss',
              solAApparaitre: this.carte.donnees.solPorte || 'F',
            }));
            break;
          case 'dalle':
            this.entites.push(new Dalle({ x: x + 1, y: y + 1, col, ligne, profondeur: -1 }));
            break;
          case 'cristal':
            this.entites.push(new Cristal({ x: x + 2, y: y + 2, col, ligne, profondeur: -1 }));
            break;
          default:
            break;
        }
      }
    }
  }

  /** Reapplique ce qui a deja ete fait dans cette salle (portes ouvertes...). */
  appliquerDrapeauxCarte() {
    for (const drapeau of this.drapeaux) {
      const correspond = drapeau.match(/^porte-(.+)-(\d+)-(\d+)$/);
      if (correspond && correspond[1] === this.carte.nom) {
        this.carte.remplacer(
          Number(correspond[2]), Number(correspond[3]),
          this.carte.donnees.solPorte || 'F'
        );
      }
    }
    if (this.drapeauLeve(`barreaux-${this.carte.nom}`)) {
      this.ouvrirBarreaux(true);
    }
  }

  lancerMusique(nom) {
    if (nom === this.musiqueActuelle) return;
    this.musiqueActuelle = nom;
    const musique = MUSIQUES[nom];
    if (musique) this.audio.jouerMusique(musique.notes, musique.options);
    else this.audio.arreterMusique();
  }

  /* =================================================================== */
  /* CHANGEMENT DE SALLE                                                 */
  /* =================================================================== */

  /** Transition en glissement quand on sort par un bord de l'ecran. */
  sortirParLeBord(direction) {
    const destination = this.carte.sorties[direction];
    if (!destination) return;

    const ancienne = creerCanvas(this.ecran.largeur, this.ecran.hauteur);
    ancienne.ctx.drawImage(this.ecran.canvas, 0, 0);

    const ancienneLargeur = this.carte.largeurPixels;
    const ancienneHauteur = this.carte.hauteurPixels;

    this.chargerSalle(destination);

    // On replace le heros de l'autre cote de l'ecran.
    const marge = 3;
    if (direction === 'ouest') this.joueur.x = this.carte.largeurPixels - this.joueur.largeur - marge;
    if (direction === 'est') this.joueur.x = marge;
    if (direction === 'nord') this.joueur.y = this.carte.hauteurPixels - this.joueur.hauteur - marge;
    if (direction === 'sud') this.joueur.y = marge;
    this.joueur.dernierePositionSure = { x: this.joueur.x, y: this.joueur.y };

    this.camera.suivre(this.joueur, this.carte, true);
    this.transition = {
      direction, image: ancienne.canvas, temps: 0, duree: CONFIG.dureeTransition,
    };
    this.joueur.bloqueEntrees = true;
    this.sauvegarder();
  }

  /** Changement avec fondu au noir (escalier, grotte, teleporteur). */
  changerDeSalle(nom, options = {}) {
    this.joueur.bloqueEntrees = true;
    this.fondu.fermerPuis(() => {
      this.chargerSalle(nom);
      if (options.arrivee) {
        this.joueur.x = options.arrivee[0] * TAILLE_TUILE + (TAILLE_TUILE - this.joueur.largeur) / 2;
        this.joueur.y = options.arrivee[1] * TAILLE_TUILE + (TAILLE_TUILE - this.joueur.hauteur) / 2;
      }
      this.joueur.dernierePositionSure = { x: this.joueur.x, y: this.joueur.y };
      this.camera.suivre(this.joueur, this.carte, true);
      this.joueur.bloqueEntrees = false;
      this.sauvegarder();
    });
  }

  /* =================================================================== */
  /* BOUCLE                                                              */
  /* =================================================================== */

  maj(dt) {
    this.temps += dt;
    this.fondu.maj(dt);
    this.camera.maj(dt);
    this.hud.maj(dt);
    this.attentes.maj(dt);

    // Transition en glissement : le jeu est fige pendant le mouvement.
    if (this.transition) {
      this.transition.temps += dt;
      if (this.transition.temps >= this.transition.duree) {
        this.transition = null;
        this.joueur.bloqueEntrees = false;
      }
      return;
    }

    // Pause
    if (this.entrees.pressee('pause') && !this.dialogue.active) {
      this.audio.jouer('menu');
      import('./scene-pause.js').then(({ ScenePause }) => {
        this.moteur.empiler(new ScenePause());
      });
      return;
    }

    // Dialogue en cours : le heros attend sagement.
    this.joueur.bloqueEntrees = this.dialogue.active || this.fondu.enCours;
    if (this.dialogue.active) {
      this.dialogue.maj(dt, this.entrees, this.audio);
      this.majObjetTrouve(dt);
      return;
    }
    this.majObjetTrouve(dt);

    // Mise a jour de toutes les entites
    for (const entite of this.entites) {
      if (entite.actif && entite.vivante) entite.maj(dt, this);
    }

    // Ajout / suppression
    if (this.aAjouter.length) {
      this.entites.push(...this.aAjouter);
      this.aAjouter.length = 0;
    }
    this.entites = this.entites.filter((entite) => entite.vivante || entite === this.joueur);

    this.particules.maj(dt);
    this.verifierBarreaux();
    this.verifierRecompense();
    this.verifierSortieParLeBord();

    // Victoire : on attend la fin du dialogue de l'objet final.
    if (this.victoireEnAttente && !this.dialogue.active) {
      this.victoireEnAttente = false;
      import('./scene-fin.js').then(({ SceneFin }) => {
        this.moteur.changerScene(new SceneFin({ victoire: true }));
      });
      return;
    }

    // Mort du heros
    if (!this.joueur.enVie) {
      this.tempsMort += dt;
      if (this.tempsMort > 1.5) {
        import('./scene-fin.js').then(({ SceneFin }) => {
          this.moteur.changerScene(new SceneFin({ victoire: false }));
        });
      }
      return;
    }

    this.camera.suivre(this.joueur, this.carte);
  }

  /** Le heros pousse-t-il contre un bord qui mene ailleurs ? */
  verifierSortieParLeBord() {
    if (this.transition || this.fondu.enCours || !this.joueur.enVie) return;
    const j = this.joueur;
    const marge = 1.5;
    if (j.x <= marge && this.entrees.axeX < 0) return this.sortirParLeBord('ouest');
    if (j.x + j.largeur >= this.carte.largeurPixels - marge && this.entrees.axeX > 0) {
      return this.sortirParLeBord('est');
    }
    if (j.y <= marge && this.entrees.axeY < 0) return this.sortirParLeBord('nord');
    if (j.y + j.hauteur >= this.carte.hauteurPixels - marge && this.entrees.axeY > 0) {
      return this.sortirParLeBord('sud');
    }
    return undefined;
  }

  /* =================================================================== */
  /* OUTILS UTILISES PAR LES ENTITES                                     */
  /* =================================================================== */

  ajouter(entite) {
    this.aAjouter.push(entite);
    return entite;
  }

  get entitesSolides() {
    return this.entites.filter((e) => e.solide && e.vivante);
  }

  get ennemisVivants() {
    return this.entites.filter((e) => e.type === 'ennemi' && e.vivante);
  }

  leverDrapeau(nom) {
    this.drapeaux.add(nom);
    evenements.emettre('drapeau', { nom, scene: this });
    this.sauvegarder();
  }

  drapeauLeve(nom) {
    return this.drapeaux.has(nom);
  }

  /** Les grilles s'ouvrent quand la salle est nettoyee. */
  verifierBarreaux() {
    if (this.carte.donnees.verrou !== 'ennemis') return;
    if (this._barreauxOuverts) return;
    if (this.ennemisVivants.length > 0) return;
    if (this.carte.trouver('V').length === 0) return;
    this._barreauxOuverts = true;
    this.ouvrirBarreaux();
  }

  ouvrirBarreaux(silencieux = false) {
    const cases = this.carte.trouver('V');
    if (cases.length === 0) return;
    for (const { col, ligne } of cases) {
      this.carte.remplacer(col, ligne, this.carte.donnees.solBarreaux || 'F');
      this.particules.emettre(col * TAILLE_TUILE + 8, ligne * TAILLE_TUILE + 8, {
        nombre: 8, couleurs: ['#a8aec0', '#ffffff'], vitesse: [20, 60],
      });
    }
    if (!silencieux) {
      this.audio.jouer('secret');
      this.leverDrapeau(`barreaux-${this.carte.nom}`);
    }
  }

  /** La recompense apparait quand la salle est nettoyee (tresor du boss). */
  verifierRecompense() {
    const recompense = this.carte.donnees.recompense;
    if (!recompense) return;
    const drapeau = `recompense-${this.carte.nom}`;
    if (this.drapeauLeve(drapeau)) return;
    if (this.ennemisVivants.length > 0) return;
    this.leverDrapeau(drapeau);
    const entite = creerEntite({ type: 'objet', ...recompense });
    if (entite) this.ajouter(entite);
    this.audio.jouer('secret');
    this.camera.secouer(2, 0.3);
  }

  fermerBarreaux() {
    // Utilise si une dalle n'est pas permanente (non utilise par defaut).
  }

  verifierDalles() {
    for (const entite of this.entites) {
      if (entite instanceof Dalle) entite.maj(0, this);
    }
  }

  /** Appele quand une tuile cassable est detruite (buisson, pot, rocher). */
  surTuileCassee(casse) {
    this.particules.emettre(casse.x, casse.y, EFFET_PAR_NOM(casse.effet));
    if (casse.son) this.audio.jouer(casse.son);
    if (casse.butin) butinRapide(casse.x, casse.y, this, casse.butin);
  }

  surCoupPorte(zone, cible) {
    this.camera.secouer(1.5, 0.12);
    this.audio.jouer('coup', 1.1);
    this.particules.emettre(cible.centreX, cible.centreY, {
      nombre: 6, couleurs: ['#ffffff', '#f2c14b'], vitesse: [30, 80], duree: [0.15, 0.3],
    });
  }

  /** Grande annonce quand on trouve un objet important. */
  montrerObjetTrouve(nomObjet, message) {
    this.objetTrouve = { objet: nomObjet, temps: 0 };
    this.dialogue.montrer([message], { titre: '' });
  }

  majObjetTrouve(dt) {
    if (!this.objetTrouve) return;
    this.objetTrouve.temps += dt;
    if (!this.dialogue.active) this.objetTrouve = null;
  }

  /* =================================================================== */
  /* SAUVEGARDE                                                          */
  /* =================================================================== */

  sauvegarder() {
    if (!CONFIG.sauvegardeAuto) return;
    Sauvegarde.ecrire('partie', {
      salle: this.carte.nom,
      x: this.joueur.x,
      y: this.joueur.y,
      pv: this.joueur.pv,
      pvMax: this.joueur.pvMax,
      inventaire: this.inventaire.versJSON(),
      drapeaux: [...this.drapeaux],
    });
  }

  chargerDepuis(donnees) {
    this.drapeaux = new Set(donnees.drapeaux || []);
    this.inventaire.depuisJSON(donnees.inventaire);
    this.chargerSalle(donnees.salle || CONFIG.salleDepart);
    this.joueur.x = donnees.x ?? CONFIG.positionDepart.x;
    this.joueur.y = donnees.y ?? CONFIG.positionDepart.y;
    this.joueur.pvMax = donnees.pvMax ?? CONFIG.vieDepart;
    this.joueur.pv = donnees.pv ?? this.joueur.pvMax;
  }

  /* =================================================================== */
  /* DESSIN                                                              */
  /* =================================================================== */

  dessiner(ctx) {
    if (this.transition) return this.dessinerTransition(ctx);
    this.dessinerMonde(ctx);
    this.dessinerInterface(ctx);
  }

  dessinerMonde(ctx) {
    ctx.fillStyle = this.carte.fond;
    ctx.fillRect(0, 0, this.ecran.largeur, this.ecran.hauteur);

    this.camera.appliquer(ctx);
    this.carte.dessinerSol(ctx);

    // On trie les entites : celles qui sont plus bas sont dessinees devant.
    const aDessiner = [...this.entites].filter((e) => e.vivante);
    aDessiner.sort((a, b) => {
      if (a.profondeur !== b.profondeur) return a.profondeur - b.profondeur;
      return (a.y + a.hauteur) - (b.y + b.hauteur);
    });
    for (const entite of aDessiner) entite.dessiner(ctx, this);

    this.particules.dessiner(ctx);
    this.carte.dessinerDessus(ctx);
    this.camera.restaurer(ctx);
  }

  dessinerInterface(ctx) {
    this.hud.dessiner(ctx, this);
    if (this.objetTrouve) this.dessinerObjetTrouve(ctx);
    this.dialogue.dessiner(ctx, this.atlas);
    this.fondu.dessiner(ctx);
    if (CONFIG.montrerFps) {
      texte(ctx, `${this.moteur.fps} fps`, 4, this.ecran.hauteur - 10, { taille: 7, couleur: '#7ee0e8' });
    }
  }

  dessinerObjetTrouve(ctx) {
    const image = this.atlas.image(
      (this.objetTrouve.objet && this.atlas.possede(this.objetTrouve.objet))
        ? this.objetTrouve.objet
        : 'etincelle'
    );
    const cx = this.ecran.largeur / 2;
    const cy = this.ecran.hauteur / 2 - 20;
    const monte = Math.min(1, this.objetTrouve.temps * 4);
    ctx.save();
    ctx.globalAlpha = 0.85;
    boite(ctx, cx - 18, cy - 18, 36, 36, { fond: '#1b1730' });
    ctx.restore();
    if (image) {
      const taille = 2;
      ctx.drawImage(
        image,
        Math.round(cx - (image.width * taille) / 2),
        Math.round(cy - (image.height * taille) / 2 - monte * 2),
        image.width * taille, image.height * taille
      );
    }
  }

  dessinerTransition(ctx) {
    const { direction, image, temps, duree } = this.transition;
    const avancee = Math.min(1, temps / duree);
    const douceur = avancee * avancee * (3 - 2 * avancee); // demarre et finit en douceur
    const L = this.ecran.largeur;
    const H = this.ecran.hauteur;
    let dx = 0;
    let dy = 0;
    if (direction === 'est') dx = -L;
    if (direction === 'ouest') dx = L;
    if (direction === 'sud') dy = -H;
    if (direction === 'nord') dy = H;

    // L'ancienne salle glisse dehors...
    ctx.save();
    ctx.translate(Math.round(dx * douceur), Math.round(dy * douceur));
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    // ... et la nouvelle entre.
    ctx.save();
    ctx.translate(Math.round(dx * douceur - dx), Math.round(dy * douceur - dy));
    this.dessinerMonde(ctx);
    ctx.restore();

    this.hud.dessiner(ctx, this);
  }
}

/** Petite aide : transforme un nom d'effet en reglage de particules. */
function EFFET_PAR_NOM(nom) {
  const effets = {
    coupHerbe: { nombre: 10, couleurs: ['#5fcf6a', '#2e8a4b', '#9ae66e'], vitesse: [30, 90], gravite: 160 },
    pierre: { nombre: 12, couleurs: ['#9aa0b0', '#5b6070', '#c9c9c9'], vitesse: [30, 90], gravite: 180 },
    eau: { nombre: 8, couleurs: ['#7ec8f2', '#4a90d9'], vitesse: [20, 60] },
  };
  return effets[nom] || effets.pierre;
}
