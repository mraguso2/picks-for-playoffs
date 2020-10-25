import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import { pickTeam, pickScore, showSubmit, preventPick, fakeUpdateWeek } from './modules/pick';
import toggleMenu from './modules/menu';

// toggle menu
const menu = $('input[name="menu"]');
if (menu) {
  menu.on('click', toggleMenu);

  // toggle menu
  const content = $('.content');
  content.on('click', toggleMenu);
}

// find all the teams
const teams = $$('.team > input[type=radio]');
teams.on('click', pickTeam);

// find all the disabled radio teams
const disabledTeams = $$('.team.disabled');
disabledTeams.on('click', preventPick);

// find all the disabled number inputs
const disabledTotalScore = $$('.totalScore.disabled');
disabledTotalScore.on('click', preventPick);

// find all the total game Score inputs
const inputGameScores = $$('input[type=number]');
inputGameScores.on('input', showSubmit);
inputGameScores.on('keyup', pickScore);

// find all the total game Score submits buttons
const submitScores = $$('span[data-score]');
submitScores.on('click', pickScore);

// prevent double click on register and login buttons
const form = $('form.dbLimit');
const formBtn = $('form.dbLimit input.button[type="submit"]');

// prevent double click on register and login buttons
const fakeUpdate = $$('button#fakeNextWeek');
fakeUpdate.on('click', fakeUpdateWeek);

if (form) {
  form.on('submit', () => {
    form.preventDefault();
    // console.log('submitted');
    formBtn.classlist.add('disabled');
  });
}
