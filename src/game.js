// game.js — mini-jeu « gauche ou droite » fidèle P1 : 5 manches, deviner de quel
// côté il va regarder ; ≥3 bonnes réponses = +1 cœur de bonheur (via le moteur).
// Module d'UI : il n'applique AUCUNE règle de jeu — il compte les manches
// gagnées et les remet à l'appelant, qui les donne à play(state, wins).

import { C } from './constants.js';

export function runMiniGame(modal, petFace, onFinish, random = Math.random) {
  let round = 0;
  let wins = 0;

  const view = (html) => {
    modal.innerHTML = `<div>${html}</div>`;
    modal.classList.remove('hidden');
  };

  function askRound() {
    round += 1;
    view(`
      <h2>Manche ${round}/${C.gameRounds} — ${wins} gagnée(s)</h2>
      <div class="big">${petFace}❓</div>
      <p>De quel côté va-t-il regarder ?</p>
      <div class="row">
        <button id="g-left">⬅ Gauche</button>
        <button id="g-right">Droite ➡</button>
      </div>`);
    modal.querySelector('#g-left').onclick = () => resolveRound('left');
    modal.querySelector('#g-right').onclick = () => resolveRound('right');
  }

  function resolveRound(guess) {
    const pet = random() < 0.5 ? 'left' : 'right';
    const won = guess === pet;
    if (won) wins += 1;
    view(`
      <h2>Manche ${round}/${C.gameRounds}</h2>
      <div class="big">${pet === 'left' ? '⬅' : ''}${petFace}${pet === 'right' ? '➡' : ''}</div>
      <p>${won ? 'Gagné !' : 'Perdu…'}</p>`);
    setTimeout(() => (round < C.gameRounds ? askRound() : finish()), 800);
  }

  function finish() {
    const heart = wins >= C.gameWinsForHeart;
    view(`
      <h2>Fini : ${wins}/${C.gameRounds}</h2>
      <div class="big">${heart ? '💛' : '💨'}</div>
      <p>${heart ? '+1 cœur de bonheur !' : 'Pas de cœur cette fois.'}</p>`);
    setTimeout(() => {
      modal.classList.add('hidden');
      onFinish(wins);
    }, 1000);
  }

  askRound();
}
