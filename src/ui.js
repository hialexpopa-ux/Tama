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
// rand injecté. Seedé par session — le déterminisme fort viendra avec la phase 2.
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
    <p class="meter-line">Faim : ${heartsRow(su.hunger)}</p>
    <p class="meter-line">Bonheur : ${heartsRow(su.happiness)}</p>
    <p class="meter-line">Discipline : ${su.discipline}%</p>
    <p class="meter-line">Âge : ${su.ageYears} an(s) — Poids : ${su.weight}</p>
    <div class="row"><button id="m-close">Fermer</button></div>`);
  face(m.querySelector('.big'), petArt(state.character), CHAR_FACE[state.character] ?? '❓');
  m.querySelector('#m-close').onclick = closeModal;
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
  state = (await store.load()) ?? T.createEgg(T.toLocalIso(Date.now()));
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

  tickNow(); // rattrapage hors-ligne (plafonné par le moteur)
  render();

  setInterval(tickNow, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tickNow();
  });
}

boot();
