// ui.js — coquille de l'app : boot, ticker UNIQUE (seul propriétaire du tick),
// rendu de l'état, boutons. AUCUNE règle de jeu ici (CLAUDE.md) : on lit l'état
// via summary(), on déclenche les actions pures du moteur, rien d'autre.

import { C, MODE } from './constants.js';
import * as T from './tama.js';
import { createLocalStore } from './store.js';
import { runMiniGame } from './game.js';
import { loadArt, noArt } from './assets.js';

const $ = (id) => document.getElementById(id);
const store = createLocalStore();
// Le moteur n'a jamais Math.random : c'est ICI (la coquille) qu'on fabrique le
// rand injecté. Seedé par session (suffisant : chaque appareil vit son pet en local).
const rand = T.makeRand(`ui|${Date.now()}|${Math.random()}`);

let state = null;
let modalBusy = false; // mini-jeu ou menu ouvert : le rendu ne touche pas au modal
let art = noArt;       // remplacé par le manifeste au boot (assets.js)

// Placeholders émoji : utilisés pour tout slot sans PNG (art via manifeste).
const CHAR_FACE = {
  egg: '🥚', baby: '🐣', child: '🐥', teen_good: '🐤', teen_bad: '🐦',
  adult_1: '🐔', adult_2: '🦜', adult_3: '🦆',
  adult_4: '🦉', adult_5: '🦩', adult_6: '🦃',
  dead: '👼',
};
// Noms français des formes (affichage seul — les ids de slot ne changent pas).
// Clin d'œil aux personnages officiels du P1 : Babytchi, Marutchi, Tamatchi,
// Kuchitamatchi, puis Mametchi, Ginjirotchi, Maskutchi, Kuchipatchi, Nyorotchi,
// Tarakotchi.
const CHAR_NAME = {
  egg: 'Œuf', baby: 'Poussin', child: 'Bouboule',
  teen_good: 'Mignon', teen_bad: 'Boudeur',
  adult_1: 'Malin', adult_2: 'Peinard', adult_3: 'Noctambule',
  adult_4: 'Glouton', adult_5: 'Zigzag', adult_6: 'Ronchon',
  dead: 'Ange',
};
const NEED_ICON = { hunger: '🍚', happy: '🎮', sick: '💊', poop: '🧹', discipline: '📢' };
const DEATH_LABEL = {
  starvation: 'mort de faim…', sickness: 'emporté par la maladie…', 'old-age': 'parti de vieillesse.',
};

const heartsRow = (n) => '♥'.repeat(n) + '♡'.repeat(C.heartsMax - n);

// ——— Affichage d'un slot d'art : PNG du manifeste, sinon placeholder émoji.
// Un fichier introuvable est mémorisé pour retomber sur l'émoji sans clignoter.
const brokenUrls = new Set();
function face(el, url, emoji) {
  if (!url || brokenUrls.has(url)) {
    if (el.dataset.src) el.dataset.src = '';
    el.textContent = emoji;
    return;
  }
  if (el.dataset.src === url) return; // déjà affiché
  el.dataset.src = url;
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.addEventListener('error', () => {
    brokenUrls.add(url);
    el.dataset.src = '';
    el.textContent = emoji;
  });
  el.replaceChildren(img);
}
const clearFace = (el) => face(el, null, '');

const petArt = (character) =>
  character === 'dead' ? art.overlay('angel') : art.stage(character);

// ——— Rendu ———
function render() {
  if (!state) return;
  const su = T.summary(state);
  const screen = $('screen');

  $('hearts').innerHTML = state.stage === 'egg' || !state.alive ? '' :
    `Faim&nbsp;&nbsp;&nbsp; ${heartsRow(su.hunger)}<br>Bonheur ${heartsRow(su.happiness)}`;
  if (su.attention) face($('attention'), art.overlay('call'), NEED_ICON[su.attention] ?? '❕');
  else clearFace($('attention'));
  face($('pet'), petArt(state.character), CHAR_FACE[state.character] ?? '❓');
  if (!state.alive) clearFace($('pet-status'));
  else if (state.flags.asleep) face($('pet-status'), art.overlay('sleep'), '💤');
  else if (state.flags.sick) face($('pet-status'), art.overlay('sick'), '💀');
  else clearFace($('pet-status'));
  if (state.flags.poop) face($('poop'), art.overlay('poop'), '💩');
  else clearFace($('poop'));
  $('light-warning').textContent = su.needsLightOff ? '💡' : '';
  $('mode-badge').textContent = `mode ${MODE}`;
  $('btn-light').classList.toggle('lit', state.flags.lightOn);

  screen.classList.toggle('night', state.flags.asleep && !state.flags.lightOn);
  screen.classList.toggle('still', state.flags.asleep || !state.alive);

  if (!state.alive && !modalBusy) showDeath();
}

function refuse() {
  const screen = $('screen');
  screen.classList.remove('refused');
  void screen.offsetWidth; // relance l'animation
  screen.classList.add('refused');
}

// ——— Application d'une action pure (contrat : refus = même référence) ———
function apply(fn) {
  if (!state) return;
  const next = fn(state);
  if (next === state) return refuse();
  state = next;
  store.save(state);
  render();
}

// ——— Ticker unique + rattrapage ———
function tickNow() {
  if (!state) return;
  const nowMs = Date.now();
  const elapsedMin = (nowMs - Date.parse(state.lastUpdate)) / 60000;
  if (elapsedMin <= 0) return;
  state = T.tick(state, elapsedMin, T.toLocalIso(nowMs), rand);
  store.save(state);
  render();
}

// ——— Modals (simples vues, aucune règle) ———
function closeModal() {
  modalBusy = false;
  $('modal').classList.add('hidden');
  render();
}

function openModal(html) {
  modalBusy = true;
  const m = $('modal');
  m.innerHTML = `<div>${html}</div>`;
  m.classList.remove('hidden');
  return m;
}

function showFeedMenu() {
  if (!state.alive) return refuse();
  const m = openModal(`
    <h2>Repas</h2>
    <div class="row">
      <button id="f-meal">🍚 Repas</button>
      <button id="f-snack">🍬 Friandise</button>
      <button id="f-cancel">Annuler</button>
    </div>`);
  m.querySelector('#f-meal').onclick = () => { closeModal(); apply((s) => T.feed(s, 'meal')); };
  m.querySelector('#f-snack').onclick = () => { closeModal(); apply((s) => T.feed(s, 'snack')); };
  m.querySelector('#f-cancel').onclick = closeModal;
}

// Check meter fidèle P1 : jamais les care mistakes (cachés).
function showMeter() {
  const su = T.summary(state);
  const m = openModal(`
    <h2>Santé</h2>
    <div class="big"></div>
    <p class="meter-line">Forme : ${CHAR_NAME[state.character] ?? '?'}</p>
    <p class="meter-line">Faim : ${heartsRow(su.hunger)}</p>
    <p class="meter-line">Bonheur : ${heartsRow(su.happiness)}</p>
    <p class="meter-line">Discipline : ${su.discipline}%</p>
    <p class="meter-line">Âge : ${su.ageYears} an(s) — Poids : ${su.weight}</p>
    <div class="row"><button id="m-close">Fermer</button></div>`);
  face(m.querySelector('.big'), petArt(state.character), CHAR_FACE[state.character] ?? '❓');
  m.querySelector('#m-close').onclick = closeModal;
}

// ——— Résumé d'absence (Bloc A) — narration douce de ce qui s'est passé pendant
// que le joueur était parti. La modale lit des FAITS purs du moteur
// (absenceSummary) ; la FORMULATION vit ici (vocabulaire, comme le reste de l'UI).
// Seuils de PRÉSENTATION (pas du gameplay → pas dans constants.js) : en-deçà on
// ne dérange pas le joueur, et le « coucou » nu n'apparaît que pour une vraie
// absence.
const RECAP_MIN_ELAPSED = 20;   // min hors-ligne avant d'envisager un résumé
const RECAP_BARE_ELAPSED = 120; // min avant d'oser un simple « coucou »

function formatAway(min) {
  if (min < 90) return `${Math.round(min)} min`;
  const h = min / 60;
  return h < 36 ? `${Math.round(h)} h` : `${Math.round(h / 24)} jour(s)`;
}

// 3 tons hiérarchisés (doctrine HANDOFF §7). RÈGLE ROUGE : on ne raconte que des
// états OBSERVABLES. Jamais les appels manqués, les care mistakes ni la raison
// d'évolution — le mystère du P1 fait partie du jeu. (`f` = faits du moteur,
// `after` = état courant pour lire faim critique / sommeil / lumière.)
function maybeShowAbsenceRecap(before, after, elapsedMin) {
  if (!after.alive) return;                    // la mort a son propre écran
  if (elapsedMin < RECAP_MIN_ELAPSED) return;  // absence trop courte
  const f = T.absenceSummary(before, after);
  const grave = [], moyen = [], neutre = [];

  // Grave — état visible qui appelle une action maintenant
  if (f.sickNow) grave.push('Il est tombé malade.');
  if (after.hunger === 0) grave.push('Il avait très faim.');

  // Moyen — petits accidents / croissance
  if (f.poopNow) moyen.push('Un caca est apparu.');
  if (after.hunger > 0 && (f.hungerLost > 0 || f.happinessLost > 0)) moyen.push('Ses cœurs ont baissé.');
  if (after.flags.asleep && after.flags.lightOn) moyen.push('La lumière est restée allumée.');
  if (f.evolvedTo) moyen.push(`Il a grandi : le voilà ${CHAR_NAME[f.evolvedTo] ?? '?'}.`);
  else if (f.agedYears > 0) moyen.push(`Il a pris ${f.agedYears} an(s).`);

  // Neutre — rien d'alarmant (« dort paisiblement » n'a de sens que sans souci grave)
  if (f.asleep && grave.length === 0) neutre.push('Chut… il dort paisiblement.');

  if (grave.length + moyen.length + neutre.length === 0) {
    if (elapsedMin < RECAP_BARE_ELAPSED) return; // rien de notable + absence brève
    neutre.push('Il t\'attendait bien sagement.');
  }

  const render = (arr, cls) => arr.map((t) => `<p class="meter-line ${cls}">${t}</p>`).join('');
  const m = openModal(`
    <h2>Pendant ton absence…</h2>
    <div class="big"></div>
    <p class="meter-line tone-neutre">${formatAway(elapsedMin)} loin de toi.</p>
    ${render(grave, 'tone-grave')}${render(moyen, 'tone-moyen')}${render(neutre, 'tone-neutre')}
    <div class="row"><button id="r-close">Coucou !</button></div>`);
  face(m.querySelector('.big'), petArt(after.character), CHAR_FACE[after.character] ?? '❓');
  m.querySelector('#r-close').onclick = closeModal;
}

function showDeath() {
  modalBusy = true;
  const m = openModal(`
    <h2>${state.name} ${DEATH_LABEL[state.deathCause] ?? 'nous a quittés.'}</h2>
    <div class="big"></div>
    <p class="meter-line">Âge : ${state.ageYears} an(s)</p>
    <div class="row"><button id="d-reset">Nouvel œuf</button></div>`);
  face(m.querySelector('.big'), art.overlay('angel'), '👼');
  m.querySelector('#d-reset').onclick = () => {
    state = T.reset(T.toLocalIso(Date.now()), state.name);
    store.save(state);
    closeModal();
  };
}

function startGame() {
  if (!T.canPlay(state)) return refuse();
  modalBusy = true;
  runMiniGame($('modal'), CHAR_FACE[state.character] ?? '❓', (wins) => {
    modalBusy = false;
    apply((s) => T.play(s, wins));
  });
}

// ——— Boot ———
async function boot() {
  const params = new URLSearchParams(location.search);

  // Mode compact (accessoire flottant, ex. widget Andy) : ?mini retire la coque
  // et n'affiche que l'écran + boutons réduits. On le GARDE dans l'URL (contrai-
  // rement à ?reset) pour que l'hôte reste en mini au fil des navigations.
  if (params.has('mini')) document.body.classList.add('mini');

  // Raccourci de test : ouvrir l'app avec ?reset repart d'un œuf neuf
  // (ex. http://localhost:8000/?reset) — évite de fouiller les DevTools.
  if (params.has('reset')) {
    await store.clear();
    // retire ?reset mais préserve les autres paramètres (ex. ?mini)
    params.delete('reset');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  }
  state = (await store.load()) ?? T.createEgg(T.toLocalIso(Date.now()));

  // Raccourci de test : ?ago=N recule l'horloge de la sauvegarde de N minutes
  // (ex. http://localhost:8000/?reset&ago=25) pour voir le résumé d'absence sans
  // attendre — le rattrapage du boot simule alors N min hors-ligne. Retiré de
  // l'URL après coup (comme ?reset) pour ne pas re-déclencher à chaque rechargement.
  const ago = Number(params.get('ago'));
  if (ago > 0) {
    state.lastUpdate = T.toLocalIso(Date.now() - ago * 60000);
    params.delete('ago');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  }

  await store.save(state);
  art = await loadArt();

  // Icônes des 7 boutons : PNG du manifeste, sinon l'émoji déjà dans le HTML
  for (const [id, slot] of [
    ['btn-feed', 'feed'], ['btn-light', 'light'], ['btn-play', 'play'],
    ['btn-medicine', 'medicine'], ['btn-clean', 'clean'],
    ['btn-meter', 'meter'], ['btn-discipline', 'discipline'],
  ]) {
    const el = $(id);
    face(el, art.icon(slot), el.textContent);
  }

  $('btn-feed').onclick = showFeedMenu;
  $('btn-light').onclick = () => apply(T.toggleLight);
  $('btn-play').onclick = startGame;
  $('btn-medicine').onclick = () => apply(T.heal);
  $('btn-clean').onclick = () => apply(T.clean);
  $('btn-meter').onclick = showMeter;
  $('btn-discipline').onclick = () => apply(T.scold);

  // Rattrapage hors-ligne au boot (plafonné par le moteur). On capture l'état
  // d'AVANT pour raconter l'absence : `state` est réassigné à un NOUVEL objet par
  // tick(), donc `before` reste intact (jamais muté).
  const before = state;
  const nowMs = Date.now();
  const elapsedMin = (nowMs - Date.parse(state.lastUpdate)) / 60000;
  if (elapsedMin > 0) {
    state = T.tick(state, elapsedMin, T.toLocalIso(nowMs), rand);
    store.save(state);
  }
  render();
  maybeShowAbsenceRecap(before, state, elapsedMin);

  setInterval(tickNow, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tickNow();
  });

  // PWA : service worker (offline) + bandeau de mise à jour.
  setupServiceWorker();
}

// ——— Service worker : offline + bandeau « nouvelle version » ———
// Indisponible en file:// ou vieux navigateur → l'app marche quand même, sans
// cache hors-ligne ni bandeau. La bascule vers la nouvelle version n'a lieu que
// si l'utilisateur clique « Recharger » (jamais de rechargement surprise).
function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const banner = $('update-banner');
  const reloadBtn = $('update-reload');

  // On ne recharge QUE suite à un clic « Recharger » : le flag évite le
  // rechargement intempestif quand le tout premier SW prend le contrôle.
  let updating = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload();
  });

  const showUpdate = (worker) => {
    if (!worker || !banner || !reloadBtn) return;
    banner.hidden = false;
    reloadBtn.onclick = () => {
      updating = true;
      banner.hidden = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  };

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    // Une mise à jour attendait déjà (installée avant ce chargement) ?
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        // « installed » + un contrôleur déjà là = vraie mise à jour (pas la
        // première installation, où il n'y a encore rien à remplacer).
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate(reg.waiting ?? nw);
        }
      });
    });

    // Vérifie s'il y a du neuf au retour sur l'app (léger, non bloquant).
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reg.update().catch(() => {});
    });
  }).catch((e) => console.warn('[tama] service worker non enregistré :', e));
}

boot();
