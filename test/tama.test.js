// test/tama.test.js — suite de tests du moteur pur, en Node sans framework.
// Lancer : `npm test` ou `node test/tama.test.js`.
// Les tests lisent leurs attentes dans constants.js (C) : ils restent valides si
// on retouche les valeurs. Les scénarios d'évolution sont « craftés » (état posé
// à la main) pour ne pas dépendre des taux aléatoires du mode courant.

import assert from 'node:assert/strict';
import { C, MODE } from '../src/constants.js';
import * as T from '../src/tama.js';

// ——— Outillage ———
const START = Date.parse('2026-07-01T09:00:00'); // 9 h locale : plein jour
const NIGHT = Date.parse('2026-07-01T23:00:00'); // 23 h locale : tout le monde dort

function localIso(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Avance le temps par petits ticks ; careFn (optionnel) est appelée entre chaque.
function simulate(state, minutes, { stepMin = 5, rand = T.makeRand('test'), startMs = START, careFn = null } = {}) {
  let s = state, ms = startMs, left = minutes;
  while (left > 0 && s.alive) {
    const step = Math.min(stepMin, left);
    ms += step * 60000;
    s = T.tick(s, step, localIso(ms), rand);
    left -= step;
    if (careFn) s = careFn(s);
  }
  return { state: s, ms };
}

// Soins parfaits : lumière gérée, soigné, grondé, nettoyé, nourri, diverti.
function perfectCare(s) {
  if (!s.alive) return s;
  if (s.flags.asleep) return s.flags.lightOn ? T.toggleLight(s) : s;
  if (!s.flags.lightOn) s = T.toggleLight(s);
  while (s.flags.sick) { const n = T.heal(s); if (n === s) break; s = n; }
  if (s.flags.misbehaving) s = T.scold(s);
  if (s.flags.poop) s = T.clean(s);
  while (s.hunger < C.heartsMax) { const n = T.feed(s, 'meal'); if (n === s) break; s = n; }
  while (s.happiness < C.heartsMax) { const n = T.play(s, C.gameRounds); if (n === s) break; s = n; }
  return s;
}

// État posé à la main (adulte sain et repu par défaut), pour des scénarios
// déterministes indépendants des taux du mode.
function craft(over = {}) {
  const { flags = {}, timers = {}, sickness = {}, ...rest } = over;
  const s = T.createEgg(localIso(START));
  s.stage = 'adult';
  s.character = 'adult_1';
  s.hunger = C.heartsMax;
  s.happiness = C.heartsMax;
  s.weight = C.baseWeight.adult;
  s.sickness.atMin = 1e9;          // pas de maladie programmée sauf demande
  s.sickness.hadThisStage = true;
  Object.assign(s, rest);
  Object.assign(s.flags, flags);
  Object.assign(s.timers, timers);
  Object.assign(s.sickness, sickness);
  if (rest.stage && rest.stage !== 'adult') s.weight = C.baseWeight[rest.stage] ?? s.weight;
  return s;
}

function hatchedBaby() {
  const egg = T.createEgg(localIso(START));
  return T.tick(egg, C.eggHatchMin + 1, localIso(START + (C.eggHatchMin + 1) * 60000), T.makeRand('hatch'));
}

function deepFreeze(o) {
  Object.freeze(o);
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return o;
}

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failures.push(name); console.error('  KO  ' + name + '\n      ' + e.message); }
}

console.log(`Tests moteur Tama (mode ${MODE})`);

// ——— Création & sérialisation ———
test('createEgg : état initial fidèle P1 et sérialisable', () => {
  const s = T.createEgg(localIso(START), 'Tama');
  assert.equal(s.stage, 'egg');
  assert.equal(s.hunger, 0);
  assert.equal(s.happiness, 0);
  assert.equal(s.discipline, 0);
  assert.equal(s.attention, null); // un œuf n'appelle pas
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('œuf : ne se nourrit pas, ne joue pas', () => {
  const s = T.createEgg(localIso(START));
  assert.equal(T.feed(s, 'meal'), s);
  assert.equal(T.play(s, 5), s);
});

test('éclosion : œuf → bébé, cœurs vides, appel faim', () => {
  const s = hatchedBaby();
  assert.equal(s.stage, 'baby');
  assert.equal(s.character, 'baby');
  assert.equal(s.weight, C.baseWeight.baby);
  assert.equal(s.attention, 'hunger');
});

// ——— Actions ———
test('repas : remplit jusqu\'à 4 puis refuse ; le poids monte', () => {
  let s = hatchedBaby();
  for (let i = 0; i < C.heartsMax; i++) s = T.feed(s, 'meal');
  assert.equal(s.hunger, C.heartsMax);
  assert.equal(s.weight, C.baseWeight.baby + C.heartsMax * C.weight.mealGain);
  assert.equal(T.feed(s, 'meal'), s); // refuse quand c'est plein
});

test('friandise : +1 bonheur, toujours acceptée, fait grossir davantage', () => {
  let s = hatchedBaby();
  const w = s.weight;
  s = T.feed(s, 'snack');
  assert.equal(s.happiness, 1);
  assert.equal(s.weight, w + C.weight.snackGain);
  let full = s;
  for (let i = 0; i < 10; i++) full = T.feed(full, 'snack');
  assert.equal(full.happiness, C.heartsMax);          // plafonne à 4
  assert.equal(full.weight, w + 11 * C.weight.snackGain); // mais grossit toujours
});

test('jouer : ≥3 manches gagnées = +1 bonheur ; le poids baisse, plancher au poids de base', () => {
  let s = craft({ happiness: 0, weight: C.baseWeight.adult + 1 });
  s = T.play(s, C.gameWinsForHeart);
  assert.equal(s.happiness, 1);
  assert.equal(s.weight, C.baseWeight.adult);
  s = T.play(s, C.gameWinsForHeart - 1); // partie perdue
  assert.equal(s.happiness, 1);          // pas de cœur
  assert.equal(s.weight, C.baseWeight.adult); // plancher tenu
});

test('gronder : +25 % par palier, seulement s\'il fait une bêtise', () => {
  const sage = craft();
  assert.equal(T.scold(sage), sage); // rien à gronder → refus
  let s = craft({ flags: { misbehaving: true } });
  s = T.scold(s);
  assert.equal(s.discipline, C.disciplineStep);
  assert.equal(s.flags.misbehaving, false);
  for (let i = 0; i < 10; i++) s = T.scold({ ...s, flags: { ...s.flags, misbehaving: true } });
  assert.equal(s.discipline, C.disciplineMax); // plafonne à 100
});

test('bêtise : il refuse repas et jeu tant qu\'on ne l\'a pas grondé', () => {
  const s = craft({ hunger: 2, flags: { misbehaving: true } });
  assert.equal(T.feed(s, 'meal'), s);
  assert.equal(T.play(s, 5), s);
});

// ——— Care mistakes ———
test('care mistake : appel faim ignoré 15 min → 1 erreur, comptée une seule fois', () => {
  let s = craft({ hunger: 0 });
  ({ state: s } = simulate(s, C.careMistakeWindowMin + 10));
  assert.equal(s.careMistakes, 1);
  assert.equal(s.attention, 'hunger');
  ({ state: s } = simulate(s, 10, { startMs: START + (C.careMistakeWindowMin + 10) * 60000 }));
  assert.equal(s.careMistakes, 1); // pas de double comptage du même appel
});

test('care mistake : nourrir referme la fenêtre, la suivante recompte', () => {
  let s = craft({ hunger: 0 });
  ({ state: s } = simulate(s, C.careMistakeWindowMin + 5));
  assert.equal(s.careMistakes, 1);
  s = T.feed(s, 'meal'); // besoin résolu
  s = { ...s, hunger: 0 }; // la faim retombe (raccourci de test)
  ({ state: s } = simulate(s, C.careMistakeWindowMin + 5, { startMs: START + 60 * 60000 }));
  assert.equal(s.careMistakes, 2);
});

// ——— Caca & maladie ———
test('caca : apparaît après l\'intervalle, nettoyer le fait disparaître', () => {
  let s = craft();
  ({ state: s } = simulate(s, C.poopIntervalMin + C.tickSubstepMin, { careFn: (x) => (x.hunger < 2 ? T.feed(x, 'meal') : x) }));
  assert.equal(s.flags.poop, true);
  s = T.clean(s);
  assert.equal(s.flags.poop, false);
});

test('caca ignoré trop longtemps → malade ; le médicament soigne en 1 à 3 doses', () => {
  let s = craft({ flags: { poop: true } });
  ({ state: s } = simulate(s, C.poopSickMin + C.tickSubstepMin, { careFn: (x) => (x.hunger < 2 ? T.feed(x, 'meal') : x) }));
  assert.equal(s.flags.sick, true);
  const doses = s.sickness.dosesLeft;
  assert.ok(doses >= 1 && doses <= C.healDosesMax);
  for (let i = 0; i < doses; i++) s = T.heal(s);
  assert.equal(s.flags.sick, false);
});

test('malade non soigné → mort (cause sickness)', () => {
  let s = craft({ flags: { sick: true }, sickness: { dosesLeft: 2, sinceMin: 0 } });
  ({ state: s } = simulate(s, C.sickDeathMin + C.tickSubstepMin, { careFn: (x) => (x.hunger < 2 ? T.feed(x, 'meal') : x) }));
  assert.equal(s.alive, false);
  assert.equal(s.deathCause, 'sickness');
  assert.equal(s.stage, 'dead');
});

test('affamé trop longtemps → mort (cause starvation)', () => {
  const careButNoFood = (x) => {
    if (!x.alive || x.flags.asleep) return x;
    if (x.flags.poop) x = T.clean(x);
    while (x.flags.sick) { const n = T.heal(x); if (n === x) break; x = n; }
    return x;
  };
  let s = craft({ hunger: 0 });
  ({ state: s } = simulate(s, C.starveDeathMin + C.tickSubstepMin, { careFn: careButNoFood }));
  assert.equal(s.alive, false);
  assert.equal(s.deathCause, 'starvation');
});

// ——— Évolution ———
test('enfant → ado : 0-1 erreurs = bon ado, 2+ = moins bon', () => {
  for (const [mistakes, expected] of [[0, 'teen_good'], [1, 'teen_good'], [2, 'teen_bad'], [5, 'teen_bad']]) {
    let s = craft({ stage: 'child', character: 'child', careMistakes: mistakes, timers: { stage: C.stageMin.child } });
    s = T.tick(s, C.tickSubstepMin, localIso(START + C.tickSubstepMin * 60000), T.makeRand('evo'));
    assert.equal(s.stage, 'teen');
    assert.equal(s.character, expected, `${mistakes} erreurs → ${expected}`);
    assert.equal(s.careMistakes, 0); // compteur remis à zéro par stade
  }
});

test('ado → adulte : rang par discipline, croisé avec la qualité de l\'ado', () => {
  for (const [teen, discipline, expected] of [
    ['teen_good', 100, 'adult_1'], ['teen_good', 75, 'adult_2'],
    ['teen_good', 50, 'adult_3'], ['teen_good', 0, 'adult_3'],
    ['teen_bad', 100, 'adult_4'], ['teen_bad', 25, 'adult_6'],
  ]) {
    let s = craft({ stage: 'teen', character: teen, discipline, timers: { stage: C.stageMin.teen } });
    s = T.tick(s, C.tickSubstepMin, localIso(START + C.tickSubstepMin * 60000), T.makeRand('evo'));
    assert.equal(s.stage, 'adult');
    assert.equal(s.character, expected, `${teen} + ${discipline}% → ${expected}`);
  }
});

test('la discipline retombe entre deux stades (100 → 50, 75 → 25)', () => {
  for (const [before, after] of [[100, 50], [75, 25], [50, 25], [25, 0]]) {
    let s = craft({ stage: 'child', character: 'child', discipline: before, timers: { stage: C.stageMin.child } });
    s = T.tick(s, C.tickSubstepMin, localIso(START + C.tickSubstepMin * 60000), T.makeRand('evo'));
    assert.equal(s.discipline, after, `${before} → ${after}`);
  }
});

test('le stade bébé ne compte pas : erreurs remises à zéro à l\'entrée du stade enfant', () => {
  let s = craft({ stage: 'baby', character: 'baby', careMistakes: 7, timers: { stage: C.stageMin.baby } });
  s = T.tick(s, C.tickSubstepMin, localIso(START + C.tickSubstepMin * 60000), T.makeRand('evo'));
  assert.equal(s.stage, 'child');
  assert.equal(s.careMistakes, 0);
  assert.equal(s.discipline, 0);
});

// ——— Sommeil & lumière ———
test('nuit : il dort, refuse les actions, lumière allumée = 1 care mistake', () => {
  let s = craft({ stage: 'child', character: 'child' });
  ({ state: s } = simulate(s, C.careMistakeWindowMin + 10, { startMs: NIGHT }));
  assert.equal(s.flags.asleep, true);
  assert.equal(s.attention, null); // pas d'appel la nuit
  assert.equal(T.feed(s, 'meal'), s);
  assert.equal(s.careMistakes, 1); // la lumière est restée allumée
  s = T.toggleLight(s);
  assert.equal(s.flags.lightOn, false);
  const before = s.careMistakes;
  ({ state: s } = simulate(s, 60, { startMs: NIGHT + (C.careMistakeWindowMin + 10) * 60000 }));
  assert.equal(s.careMistakes, before); // plus d'erreur une fois la lumière éteinte
});

test('nuit : décroissances gelées (les cœurs ne bougent pas en dormant)', () => {
  let s = craft({ stage: 'child', character: 'child', flags: { lightOn: false } });
  const { hunger, happiness } = s;
  ({ state: s } = simulate(s, 4 * 60, { startMs: NIGHT }));
  assert.equal(s.hunger, hunger);
  assert.equal(s.happiness, happiness);
});

// ——— Tick : plafond & déterminisme ———
test('rattrapage hors-ligne plafonné : 48 h d\'absence = 12 h simulées', () => {
  const now = localIso(START + 48 * 60 * 60000);
  const a = T.tick(craft(), 48 * 60, now, T.makeRand('cap'));
  const b = T.tick(craft(), C.catchupCapMin, now, T.makeRand('cap'));
  assert.deepEqual(a, b);
});

test('déterminisme : même seed → même vie, au bit près', () => {
  const run = () => simulate(T.createEgg(localIso(START)), 6 * 60, { rand: T.makeRand('seed-42'), careFn: perfectCare }).state;
  assert.deepEqual(run(), run());
});

test('vie bien soignée : il atteint l\'âge adulte en bon ado, vivant', () => {
  const { state: s } = simulate(T.createEgg(localIso(START)), 8 * 60, { rand: T.makeRand('good-life'), careFn: perfectCare });
  assert.equal(s.alive, true);
  assert.equal(s.stage, MODE === 'dev' ? 'adult' : s.stage); // en officiel la vie est plus longue que 8 h
  if (s.stage === 'adult') assert.match(s.character, /^adult_[123]$/); // famille « bon ado »
});

test('vie négligée : il meurt', () => {
  const { state: s } = simulate(T.createEgg(localIso(START)), 24 * 60, { rand: T.makeRand('bad-life'), stepMin: 30 });
  assert.equal(s.alive, false);
  assert.ok(s.deathCause);
});

// ——— Pureté ———
test('pureté : tick et actions ne mutent jamais l\'état d\'entrée', () => {
  const s = deepFreeze(hatchedBaby());
  const snapshot = JSON.stringify(s);
  T.tick(s, 60, localIso(START + 90 * 60000), T.makeRand('pure'));
  T.feed(s, 'meal'); T.feed(s, 'snack'); T.play(s, 5); T.clean(s); T.heal(s); T.scold(s); T.toggleLight(s);
  assert.equal(JSON.stringify(s), snapshot);
});

test('summary : humeur cohérente, sans jamais exposer les care mistakes', () => {
  assert.equal(T.summary(craft()).mood, 'happy');
  assert.equal(T.summary(craft({ hunger: 0 })).mood, 'sad');
  assert.equal(T.summary(craft({ flags: { sick: true } })).mood, 'sick');
  assert.equal(T.summary(craft({ alive: false, stage: 'dead' })).mood, 'dead');
  const keys = Object.keys(T.summary(craft()));
  assert.ok(!keys.some((k) => /mistake/i.test(k)));
});

// ——— Bilan ———
console.log(`\n${passed} réussis, ${failures.length} échoués${failures.length ? ' : ' + failures.join(', ') : ''}`);
if (failures.length) process.exit(1);
