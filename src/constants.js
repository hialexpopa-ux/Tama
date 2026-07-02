// constants.js — TOUTES les valeurs de gameplay vivent ici, nulle part ailleurs
// (règle CLAUDE.md). Deux jeux de valeurs (TAMA-START.md §5) :
//   - official : fidélité au P1 Bandai (durées réelles, en heures/jours)
//   - dev      : stades courts pour tester vite + décroissance lente pour un
//                rythme « 2-3 soins/jour » jouable
// Bascule via MODE. Tout est réglable ; les mécaniques, elles, sont dans tama.js.

export const MODE = 'official'; // 'official' | 'dev'

// ——— Communes aux deux modes (fidélité P1 non négociable) ———
const SHARED = {
  heartsMax: 4,             // faim et bonheur : 4 cœurs chacun
  disciplineStep: 25,       // +25 % par grondement correct
  disciplineMax: 100,       // paliers officiels : 0 / 25 / 50 / 75 / 100

  tickSubstepMin: 15,       // sous-pas de simulation du tick
  catchupCapMin: 12 * 60,   // plafond de rattrapage hors-ligne : 12 h

  careMistakeWindowMin: 15, // fenêtre de réponse à un appel légitime

  // Poids : base infranchissable par stade ; manger fait grossir, jouer maigrir.
  // Atteindre le poids max rend malade (le gavage nuit à la santé, TAMA-START §4).
  weight: { mealGain: 1, snackGain: 2, playLoss: 1, max: 99 },
  baseWeight: { baby: 5, child: 10, teen: 20, adult: 30 },

  // Sommeil nocturne PAR PERSONNAGE (fidèle P1 : chaque forme a son propre
  // rythme — source thaao.net/tama/p1). Heures locales. Endormi : décroissances
  // et appels gelés ; lumière allumée = care mistake.
  // ŒUF et BÉBÉ absents VOLONTAIREMENT : sur le vrai P1, Babytchi ne dort
  // jamais la nuit — il vit son stade d'une traite (+ micro-sieste, cf. babyNap).
  sleep: {
    child:     { start: 20, end: 9 },  // Bouboule (Marutchi)
    teen_good: { start: 21, end: 9 },  // Mignon (Tamatchi)
    teen_bad:  { start: 21, end: 9 },  // Boudeur (Kuchitamatchi)
    adult_1:   { start: 22, end: 9 },  // Malin (Mametchi)
    adult_2:   { start: 22, end: 9 },  // Peinard (Ginjirotchi)
    adult_3:   { start: 23, end: 11 }, // Noctambule (Maskutchi), couche-tard
    adult_4:   { start: 22, end: 9 },  // Glouton (Kuchipatchi)
    adult_5:   { start: 22, end: 9 },  // Zigzag (Nyorotchi)
    adult_6:   { start: 22, end: 10 }, // Ronchon (Tarakotchi), grasse matinée
  },

  // Évolution (TAMA-START §4) : 0-1 care mistakes au stade enfant → « bon » ado ;
  // ado → adulte par palier de discipline (100 → rang 1, 75 → rang 2, ≤50 → rang 3).
  goodTeenMaxMistakes: 1,

  // Maladie : une fois par stade, à un instant tiré dans cette fenêtre (fraction
  // de la durée du stade) ; le médicament soigne en 1 à healDosesMax doses.
  sickAtFracMin: 0.4,
  sickAtFracMax: 0.8,
  healDosesMax: 3,

  // Bêtises (appels discipline) : durée d'un épisode ; ne pas gronder n'est PAS
  // un care mistake (TAMA-START §4).
  misbehaveDurationMin: 15,

  // Mini-jeu « gauche ou droite » : 5 manches, ≥3 victoires = +1 cœur bonheur.
  gameRounds: 5,
  gameWinsForHeart: 3,
};

// ——— Spécifiques au mode ———
const OFFICIAL = {
  eggHatchMin: 5,                       // éclosion ~5 min
  stageMin: { baby: 65, child: 24 * 60, teen: 48 * 60 }, // bébé : 65 min mesurées sur le vrai P1
  babyNap: { atMin: 40, durationMin: 5 }, // micro-sieste du bébé (mesurée sur le vrai P1)
  // Décroissance PAR STADE : le bébé du vrai P1 perd 1 cœur de faim / 3 min et
  // 1 cœur de bonheur / 4 min (mesuré) ; les stades suivants sont approximés
  // (le P1 accélère avec l'âge — non modélisé).
  hungerDecayMin:    { baby: 3, child: 60, teen: 60, adult: 60 },
  happinessDecayMin: { baby: 4, child: 70, teen: 70, adult: 70 },
  poopIntervalMin: 180,                 // un caca toutes les X min (éveillé)
  poopSickMin: 120,                     // rester X min dans son caca → malade
  misbehaveChancePerHour: 0.25,         // espérance d'appels discipline
  sickDeathMin: 6 * 60,                 // malade non soigné X min → mort
  starveDeathMin: 12 * 60,              // faim à 0 pendant X min → mort
  ageDayMin: 24 * 60,                   // officiel : 1 jour = 1 « année » tama
  oldAgeYears: 10,                      // au-delà : risque de mort de vieillesse
  oldAgeDeathChancePerDay: 0.25,
};

// Mode dev = OBSERVER une vie complète en ~30 min : tout doit se manifester
// (faim, bonheur, caca, maladie, discipline) pendant qu'on regarde.
const DEV = {
  eggHatchMin: 0.5,                     // 30 s
  stageMin: { baby: 2, child: 10, teen: 15 },
  babyNap: null,                        // stade bébé de 2 min : pas la place pour la sieste
  hungerDecayMin:    { baby: 1, child: 2, teen: 3, adult: 4 },
  happinessDecayMin: { baby: 1.5, child: 2.5, teen: 3.5, adult: 5 },
  poopIntervalMin: 5,
  poopSickMin: 15,
  misbehaveChancePerHour: 4,            // fréquent, pour pouvoir tester la discipline
  sickDeathMin: 30,
  starveDeathMin: 45,
  ageDayMin: 15,                        // 15 min = 1 « année » tama
  oldAgeYears: 10,
  oldAgeDeathChancePerDay: 0.25,
};

export const MODES = {
  official: { ...SHARED, ...OFFICIAL },
  dev: { ...SHARED, ...DEV },
};

export const C = MODES[MODE];
