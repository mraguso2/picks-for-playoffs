import axios from 'axios';
import { $, $$ } from './bling';

function updateQueryStringParameter(uri, key, value) {
  const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
  const separator = uri.indexOf('?') !== -1 ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, `$1${key}=${value}$2`);
  }

  return `${uri + separator + key}=${value}`;
}

function removeLocStorageGames(gameIdList) {
  // localStorage.clear();
  gameIdList.map(game => localStorage.removeItem(game));
}

function tagGameToLocStorage(gameIdList) {
  const gamePicks = gameIdList
    .map(game => {
      const gameVals = JSON.parse(localStorage.getItem(game));
      if (!gameVals) return;

      const addedGameId = Object.keys(gameVals).reduce((acc, cur) => {
        acc[`${cur}_${game}`] = gameVals[cur];
        return acc;
      }, {});
      return addedGameId;
    })
    .filter(Boolean);

  const mergedGamePickVals = gamePicks.length === 0 ? {} : Object.assign(...gamePicks);
  return mergedGamePickVals;
}

export const fakeUpdateWeek = function updateFakeWeek() {
  const gameIds = [
    '2019010500',
    '2019010501',
    '2019010601',
    '2019010600',
    '2019011200',
    '2019011301',
    '2019011300',
    '2019011201',
    '2019012001',
    '2019012000',
    '2019020300'
  ];

  const current = window.location.pathname.split('/')[2];
  let next;
  switch (current) {
    case 'wildcard':
      next = 'division';
      break;
    case 'division':
      next = 'conference';
      break;
    case 'conference':
      next = 'superbowl';
      break;
    case 'superbowl':
      next = 'final';
      break;
    case 'final':
      removeLocStorageGames(gameIds);
      next = 'wildcard';
      break;
    default:
      removeLocStorageGames(gameIds);
      next = 'wildcard';
  }

  const userPicks = tagGameToLocStorage(gameIds);
  const searchQuery = Object.keys(userPicks)
    .map(key => `${key}=${userPicks[key]}`)
    .join('&');

  const lastForwardSlash = window.location.href.lastIndexOf('/');
  const nextPage = `${window.location.href.substr(0, lastForwardSlash)}/${next}?${searchQuery}`;
  window.location.assign(nextPage);
};

export const pickTeam = function pickedATeam() {
  this.disabled = true;
  const eid = this.name;
  const team = this.id.split('_')[1];
  const year = window.location.href.slice(-4);

  // Handle fake bracket for guest user
  if (window.location.pathname.substr(1, 4) === 'fake') {
    // const gameId = ${eid}

    // window.location.search = updateQueryStringParameter(window.location.search, eid, team);
    // remove picked class from both teams
    const storedPicks = localStorage.getItem(`${eid}`);
    const gamePicks = JSON.parse(storedPicks);

    let updatedGamePicks;
    if (gamePicks) {
      gamePicks.winningTeamPick = team;
      updatedGamePicks = gamePicks;
    } else {
      updatedGamePicks = { winningTeamPick: team };
    }

    localStorage.setItem(`${eid}`, JSON.stringify(updatedGamePicks));

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
    return;
  }

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

  // Handle fake bracket for guest user
  if (window.location.pathname.substr(1, 4) === 'fake') {
    const storedPicks = localStorage.getItem(`${eid}`);
    const gamePicks = JSON.parse(storedPicks);

    let updatedGamePicks;
    if (gamePicks) {
      gamePicks.totalGameScore = score;
      updatedGamePicks = gamePicks;
    } else {
      updatedGamePicks = { totalGameScore: score };
    }

    localStorage.setItem(`${eid}`, JSON.stringify(updatedGamePicks));

    const saved = $(`[data-total="${eid}"]`);
    saved.classList.add('totalScore__show');
    setTimeout(() => saved.classList.remove('totalScore__show'), 1500);
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
