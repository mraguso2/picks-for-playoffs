import axios from 'axios';
import { $, $$ } from './bling';

export const pickTeam = function pickedATeam() {
  this.disabled = true;
  const eid = this.name;
  const team = this.id.split('_')[1];
  const year = window.location.href.slice(-4);

  axios
    .post(`/api/v1/pickWinner/${year}/${eid}/${team}`)
    .then(res => {
      if (res.data.action === 'invalid') {
        window.scrollTo(0, 0);
        return location.reload();
      }
      // remove picked class from both teams
      const teamsInGame = Array.from($$(`[data-game="${eid}"]`));
      teamsInGame.map(option => option.classList.remove('picked'));

      // update teams picked
      const teamPicked = $(`[data-game="${eid}"][data-team="${team}"]`);
      teamPicked.classList.toggle('picked');

      // add animation
      teamPicked.classList.add('football__icon--float');
      // // arrow fn so will keep access to this obj
      setTimeout(() => teamPicked.classList.remove('football__icon--float'), 2500);
      this.disabled = false;
    })
    .catch(console.error);
};

export const showSubmit = function submitButt() {
  const eid = this.name.split('_')[1];
  const submit = $(`[data-score="${eid}"]`);

  if (this.classList.contains('disabled')) return;

  if (!this.value) {
    submit.classList.remove('submitScore__display', 'submitScore__display--show');
    return;
  }

  submit.classList.add('submitScore__display');
  // force reflow
  const height = this.scrollHeight;
  submit.classList.add('submitScore__display--show');
};

export const pickScore = function totalScore(e) {
  const year = window.location.href.slice(-4);
  if (e.keyCode === 8 || e.keyCode === 46) return;
  let eid;
  let scoreInput;

  if (e.keyCode === 13) {
    // pressed enter key
    eid = this.name.split('_')[1];
    scoreInput = this;
    const submit = $(`[data-score="${eid}"]`);
    submit.classList.remove('submitScore__display', 'submitScore__display--show');
  } else {
    // click submit link
    this.classList.remove('submitScore__display', 'submitScore__display--show');
    eid = this.dataset.score;
    scoreInput = $(`input[name="score_${eid}"]`);
    if (!eid) return;
  }
  if (!eid) return;

  let score;

  if (scoreInput.value === '') {
    score = 0;
  } else {
    score = Math.round(scoreInput.value);
    scoreInput.value = Math.round(scoreInput.value);
  }
  if (isNaN(score)) {
    // TODO add simple popup on game card - Please enter a number
    return;
  }

  axios
    .post(`/api/v1/pickScore/${year}/${eid}/${score}`)
    .then(res => {
      if (res.data.action === 'invalid') {
        window.scrollTo(0, 0);
        return location.reload();
      }
      const saved = $(`[data-total="${eid}"]`);
      saved.classList.add('totalScore__show');
      setTimeout(() => saved.classList.remove('totalScore__show'), 1500);
    })
    .catch(console.error);
};

export const preventPick = function() {
  const lock = $(`[data-lock="${this.dataset.game || this.dataset.total}"] > .gameStatus`);
  lock.classList.add('gameStatus__shake');
  setTimeout(() => lock.classList.remove('gameStatus__shake'), 800);
};
