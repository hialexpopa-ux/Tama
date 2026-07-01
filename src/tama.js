// tama.js — MOTEUR pur du Tamagotchi P1 (TAMA-START.md §3-§7).
// Règles d'or (CLAUDE.md) : aucun accès DOM / fs / réseau ; horloge et aléatoire
// INJECTÉS (jamais Date.now() ni Math.random() ici) ; état sérialisable unique ;
// actions pures qui renvoient le nouvel état (ou l'état d'ENTRÉE, même référence,
// si l'action est refusée — c'est le contrat « refus »).
//
// Convention d'horloge : les ISO passés sont en HEURE LOCALE SANS suffixe Z
// (ex. "2026-07-01T09:00:00") — c'est l'heure du joueur qui pilote le sommeil.

import { C } from './constants.js';

const MS_PER_MIN = 60000;
export const STAGES = ['egg', 'baby', 'child', 'teen', 'adult'];
const NEXT_STAGE = { egg: 'baby', baby: 'child', child: 'teen', teen: 'adult' };

// ——— Aléatoire seedé injectable (mulberry32 + hash de chaîne) ———
// Pas obligatoire en phase 1, mais ferme une classe de bugs et garde la porte
// de l'event-sourcing ouverte (TAMA-START §7).
export function makeRand(seedStr) {
  let h = 1779033703 ^ String(seedStr).length;
  for (let i = 0; i < String(seedStr).length; i++) {
    h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ——— Création ———
export function createEgg(nowIso, name = 'Tama') {
  return {
    version: 1,
    name,
    bornAt: nowIso,
    lastUpdate: nowIso,
    stage: 'egg',
    character: 'egg',      // id de slot d'art (assets/manifest.json)
    alive: true,
    deathCause: null,      // null | 'starvation' | 'sickness' | 'old-age'
    ageYears: 0,

    hunger: 0,             // 0..4 cœurs (0 = affamé) — vides au départ
    happiness: 0,          // 0..4 cœurs
    discipline: 0,         // paliers 0 / 25 / 50 / 75 / 100
    weight: 0,             // posé au poids de base à l'éclosion

    flags: { poop: false, sick: false, asleep: false, misbehaving: false, lightOn: true },
    attention: null,       // null | hunger | happy | sick | poop | discipline
    callStartedAt: null,

    careMistakes: 0,       // CACHÉ, par stade → pilote l'évolution
    careMistakesTotal: 0,  // cumul vie entière (debug, jamais affiché)
    care: { meals: 0, snacks: 0, games: 0, cleans: 0, heals: 0, scolds: 0 },

    // Internes du moteur (sérialisés avec l'état — nécessaires au tick pur)
    sickness: { atMin: null, dosesLeft: 0, sinceMin: 0, hadThisStage: false },
    timers: {
      stage: 0,        // min écoulées dans le stade courant
      age: 0,          // min de vie depuis l'éclosion
      hunger: 0,       // min depuis la dernière perte de cœur de faim
      happy: 0,
      poop: 0,         // min depuis le dernier caca (ou nettoyage)
      poopDirty: 0,    // min passées avec un caca à l'écran
      hungerNeed: 0,   // min avec faim à 0 (fenêtre care mistake + famine)
      happyNeed: 0,
      lightSleep: 0,   // min endormi avec la lumière allumée
      misbehave: 0,    // min depuis le début de l'épisode de bêtise
    },
    counted: { hunger: false, happy: false, sick: false, poop: false, light: false },
  };
}

// ——— Helpers purs ———
function localHour(ms) { return new Date(ms).getHours(); }

// Convention d'horloge du moteur : ISO en heure LOCALE, sans suffixe Z.
// Exporté pour que l'UI et les tests fabriquent leurs nowIso pareil.
export function toLocalIso(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function isSleepHour(stage, hour) {
  const w = C.sleep[stage];
  if (!w) return false; // l'œuf ne dort pas
  return w.start > w.end ? (hour >= w.start || hour < w.end) : (hour >= w.start && hour < w.end);
}

// Palier de retombée entre deux stades : 100→50, 75→25, 50→25, 25→0.
function disciplineDrop(d) {
  return Math.floor(d / 2 / C.disciplineStep) * C.disciplineStep;
}

function scheduleSickness(stage, rand) {
  const span = stage === 'adult' ? C.ageDayMin : C.stageMin[stage];
  return span * (C.sickAtFracMin + (C.sickAtFracMax - C.sickAtFracMin) * rand());
}

function becomeSick(s, rand) {
  if (s.flags.sick) return;
  s.flags.sick = true;
  s.sickness.dosesLeft = 1 + Math.floor(rand() * C.healDosesMax); // 1..3
  s.sickness.sinceMin = 0;
  s.counted.sick = false;
}

function careMistake(s, need) {
  s.careMistakes += 1;
  s.careMistakesTotal += 1;
  s.counted[need] = true;
}

function die(s, cause) {
  s.alive = false;
  s.deathCause = cause;
  s.stage = 'dead';
  s.character = 'dead';
  s.flags.asleep = false;
  s.flags.misbehaving = false;
}

function evolve(s, rand) {
  const next = NEXT_STAGE[s.stage];
  if (next === 'child') {
    // Rien de ce qui se passe au stade bébé ne compte (TAMA-START §4)
    s.character = 'child';
    s.discipline = 0;
  } else if (next === 'teen') {
    s.character = s.careMistakes <= C.goodTeenMaxMistakes ? 'teen_good' : 'teen_bad';
    s.discipline = disciplineDrop(s.discipline);
  } else if (next === 'adult') {
    // Rang par discipline, croisé avec la qualité de l'ado → 6 adultes (P1 en a 6)
    const rank = s.discipline >= 100 ? 1 : s.discipline >= 75 ? 2 : 3;
    const offset = s.character === 'teen_good' ? 0 : 3;
    s.character = `adult_${offset + rank}`;
    s.discipline = disciplineDrop(s.discipline);
  }
  s.stage = next;
  s.careMistakes = 0;
  s.weight = Math.max(s.weight, C.baseWeight[next]);
  s.timers.stage = 0;
  s.sickness.hadThisStage = false;
  s.sickness.atMin = scheduleSickness(next, rand);
}

// Besoin actif le plus prioritaire (pour l'icône d'appel) : malade > faim >
// bonheur > caca > discipline.
function activeNeed(s) {
  if (!s.alive || s.flags.asleep || s.stage === 'egg') return null;
  if (s.flags.sick) return 'sick';
  if (s.hunger === 0) return 'hunger';
  if (s.happiness === 0) return 'happy';
  if (s.flags.poop) return 'poop';
  if (s.flags.misbehaving) return 'discipline';
  return null;
}

function refreshAttention(s, nowIso) {
  const need = activeNeed(s);
  if (need === null) {
    s.attention = null;
    s.callStartedAt = null;
  } else if (need !== s.attention) {
    s.attention = need;
    s.callStartedAt = nowIso ?? s.lastUpdate;
  }
}

// ——— Un sous-pas de simulation (mutation interne d'une copie de travail) ———
function stepOnce(s, stepMin, simMs, rand) {
  // Œuf : seul le minuteur d'éclosion tourne
  if (s.stage === 'egg') {
    s.timers.stage += stepMin;
    if (s.timers.stage >= C.eggHatchMin) {
      s.stage = 'baby';
      s.character = 'baby';
      s.weight = C.baseWeight.baby;
      s.timers.stage = 0;
      s.timers.age = 0;
      s.sickness.hadThisStage = false;
      s.sickness.atMin = scheduleSickness('baby', rand);
    }
    return;
  }

  s.timers.age += stepMin;
  s.ageYears = Math.floor(s.timers.age / C.ageDayMin);
  s.timers.stage += stepMin;

  const asleep = isSleepHour(s.stage, localHour(simMs));
  s.flags.asleep = asleep;

  if (asleep) {
    // Nuit : décroissances, appels et bêtises gelés. Seule la lumière compte.
    s.flags.misbehaving = false;
    s.timers.misbehave = 0;
    if (s.flags.lightOn) {
      s.timers.lightSleep += stepMin;
      if (s.timers.lightSleep >= C.careMistakeWindowMin && !s.counted.light) {
        careMistake(s, 'light'); // une fois par nuit
      }
    } else {
      s.timers.lightSleep = 0;
    }
  } else {
    s.timers.lightSleep = 0;
    s.counted.light = false;

    // Décroissance faim / bonheur
    s.timers.hunger += stepMin;
    while (s.timers.hunger >= C.hungerDecayMin) {
      s.timers.hunger -= C.hungerDecayMin;
      s.hunger = Math.max(0, s.hunger - 1);
    }
    s.timers.happy += stepMin;
    while (s.timers.happy >= C.happinessDecayMin) {
      s.timers.happy -= C.happinessDecayMin;
      s.happiness = Math.max(0, s.happiness - 1);
    }

    // Caca
    s.timers.poop += stepMin;
    if (s.timers.poop >= C.poopIntervalMin) {
      s.timers.poop = 0;
      s.flags.poop = true;
    }
    if (s.flags.poop) {
      s.timers.poopDirty += stepMin;
      if (s.timers.poopDirty >= C.careMistakeWindowMin && !s.counted.poop) {
        careMistake(s, 'poop');
      }
      if (s.timers.poopDirty >= C.poopSickMin) becomeSick(s, rand);
    }

    // Maladie programmée du stade + gavage
    if (!s.sickness.hadThisStage && s.timers.stage >= s.sickness.atMin) {
      s.sickness.hadThisStage = true;
      becomeSick(s, rand);
    }
    if (s.weight >= C.weight.max) becomeSick(s, rand);

    // Bêtises (appel discipline) — à partir du stade enfant
    if (s.flags.misbehaving) {
      s.timers.misbehave += stepMin;
      if (s.timers.misbehave >= C.misbehaveDurationMin) {
        s.flags.misbehaving = false; // pas de care mistake : ne pas gronder est un choix
        s.timers.misbehave = 0;
      }
    } else if (s.stage !== 'baby' && !s.flags.sick) {
      if (rand() < (C.misbehaveChancePerHour * stepMin) / 60) {
        s.flags.misbehaving = true;
        s.timers.misbehave = 0;
      }
    }

    // Fenêtres de care mistake (faim / bonheur) + famine
    if (s.hunger === 0) {
      s.timers.hungerNeed += stepMin;
      if (s.timers.hungerNeed >= C.careMistakeWindowMin && !s.counted.hunger) {
        careMistake(s, 'hunger');
      }
      if (s.timers.hungerNeed >= C.starveDeathMin) return die(s, 'starvation');
    } else {
      s.timers.hungerNeed = 0;
      s.counted.hunger = false;
    }
    if (s.happiness === 0) {
      s.timers.happyNeed += stepMin;
      if (s.timers.happyNeed >= C.careMistakeWindowMin && !s.counted.happy) {
        careMistake(s, 'happy');
      }
    } else {
      s.timers.happyNeed = 0;
      s.counted.happy = false;
    }
  }

  // Maladie : progresse jour et nuit ; non soignée assez longtemps → mort
  if (s.flags.sick) {
    s.sickness.sinceMin += stepMin;
    if (s.sickness.sinceMin >= C.careMistakeWindowMin && !s.counted.sick) {
      careMistake(s, 'sick');
    }
    if (s.sickness.sinceMin >= C.sickDeathMin) return die(s, 'sickness');
  }

  // Vieillesse (adultes seulement)
  if (s.stage === 'adult' && s.ageYears >= C.oldAgeYears) {
    if (rand() < (C.oldAgeDeathChancePerDay * stepMin) / (24 * 60)) {
      return die(s, 'old-age');
    }
  }

  // Évolution (jamais pendant le sommeil : différée au réveil)
  if (!asleep && NEXT_STAGE[s.stage] && s.timers.stage >= C.stageMin[s.stage]) {
    evolve(s, rand);
  }
}

// ——— Tick : rattrape elapsedMin (plafonné) par sous-pas de 15 min ———
export function tick(state, elapsedMin, nowIso, rand) {
  const s = structuredClone(state);
  if (!s.alive) { s.lastUpdate = nowIso; return s; }

  const total = Math.max(0, Math.min(elapsedMin, C.catchupCapMin));
  const endMs = Date.parse(nowIso);
  let done = 0;
  while (done < total && s.alive) {
    const step = Math.min(C.tickSubstepMin, total - done);
    const simMs = endMs - (total - done) * MS_PER_MIN; // début du sous-pas
    stepOnce(s, step, simMs, rand);
    done += step;
  }
  s.lastUpdate = nowIso;
  refreshAttention(s, nowIso);
  return s;
}

// Un besoin résolu referme sa fenêtre de care mistake immédiatement (sans
// attendre le prochain tick) — sinon un besoin qui retombe vite hériterait de
// l'ancienne fenêtre déjà comptée.
function closeResolvedWindows(s) {
  if (s.hunger > 0) { s.timers.hungerNeed = 0; s.counted.hunger = false; }
  if (s.happiness > 0) { s.timers.happyNeed = 0; s.counted.happy = false; }
  if (!s.flags.poop) { s.timers.poopDirty = 0; s.counted.poop = false; }
  if (!s.flags.sick) { s.sickness.sinceMin = 0; s.counted.sick = false; }
}

// ——— Actions pures ———
// Contrat : renvoie le NOUVEL état, ou l'état d'entrée (même référence) si refusé.
function mutate(state, fn) {
  const s = structuredClone(state);
  if (fn(s) === false) return state;
  closeResolvedWindows(s);
  refreshAttention(s);
  return s;
}

export function feed(state, kind /* 'meal' | 'snack' */) {
  return mutate(state, (s) => {
    if (!s.alive || s.flags.asleep || s.flags.sick || s.flags.misbehaving) return false;
    if (s.stage === 'egg') return false;
    if (kind === 'meal') {
      if (s.hunger >= C.heartsMax) return false; // refuse quand c'est plein
      s.hunger += 1;
      s.weight = Math.min(C.weight.max, s.weight + C.weight.mealGain);
      s.care.meals += 1;
    } else {
      // Friandise : toujours acceptée (fidèle P1), mais fait grossir davantage
      s.happiness = Math.min(C.heartsMax, s.happiness + 1);
      s.weight = Math.min(C.weight.max, s.weight + C.weight.snackGain);
      s.care.snacks += 1;
    }
  });
}

// Le pet accepte-t-il de jouer ? (exporté pour que l'UI n'ouvre pas le mini-jeu
// pour rien, sans dupliquer la règle chez elle)
export function canPlay(state) {
  return state.alive && !state.flags.asleep && !state.flags.sick
    && !state.flags.misbehaving && state.stage !== 'egg';
}

// wins = manches gagnées sur C.gameRounds (le mini-jeu vit dans l'UI, game.js)
export function play(state, wins) {
  return mutate(state, (s) => {
    if (!canPlay(s)) return false;
    s.care.games += 1;
    s.weight = Math.max(C.baseWeight[s.stage] ?? 0, s.weight - C.weight.playLoss);
    if (wins >= C.gameWinsForHeart) s.happiness = Math.min(C.heartsMax, s.happiness + 1);
  });
}

export function clean(state) {
  return mutate(state, (s) => {
    if (!s.alive || !s.flags.poop) return false;
    s.flags.poop = false;
    s.timers.poop = 0;
    s.timers.poopDirty = 0;
    s.counted.poop = false;
    s.care.cleans += 1;
  });
}

export function heal(state) {
  return mutate(state, (s) => {
    if (!s.alive || !s.flags.sick) return false;
    s.care.heals += 1;
    s.sickness.dosesLeft -= 1;
    if (s.sickness.dosesLeft <= 0) {
      s.flags.sick = false;
      s.sickness.sinceMin = 0;
      s.counted.sick = false;
    }
  });
}

export function scold(state) {
  return mutate(state, (s) => {
    if (!s.alive || s.flags.asleep || !s.flags.misbehaving) return false;
    if (s.stage === 'egg' || s.stage === 'baby') return false;
    s.flags.misbehaving = false;
    s.timers.misbehave = 0;
    s.discipline = Math.min(C.disciplineMax, s.discipline + C.disciplineStep);
    s.care.scolds += 1;
  });
}

export function toggleLight(state) {
  return mutate(state, (s) => {
    if (!s.alive) return false;
    s.flags.lightOn = !s.flags.lightOn;
  });
}

export function reset(nowIso, name) {
  return createEgg(nowIso, name);
}

// ——— Résumé pour l'UI (le check meter n'expose JAMAIS les care mistakes) ———
export function summary(state) {
  const mood = !state.alive ? 'dead'
    : state.flags.asleep ? 'asleep'
    : state.flags.sick ? 'sick'
    : (state.hunger === 0 || state.happiness === 0) ? 'sad'
    : (state.hunger + state.happiness <= 4) ? 'meh'
    : 'happy';
  return {
    mood,
    attention: state.attention,
    needsLightOff: state.flags.asleep && state.flags.lightOn,
    stage: state.stage,
    character: state.character,
    hunger: state.hunger,
    happiness: state.happiness,
    discipline: state.discipline,
    weight: state.weight,
    ageYears: state.ageYears,
  };
}
