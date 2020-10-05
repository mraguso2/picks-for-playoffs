const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const promisify = require('es6-promisify');
const { capIt } = require('../helpers');
const { nflTeams } = require('../data/nflTeams');

const Game = mongoose.model('Game');
const User = mongoose.model('User');

exports.home = (req, res) => {
  res.render('admin', { title: 'Admin' });
};

function calcConference(hnn, vnn) {
  // find both teams
  const homeConf = nflTeams.filter(team => team.franchise === hnn).map(team => team.conference)[0];
  const awayConf = nflTeams.filter(team => team.franchise === vnn).map(team => team.conference)[0];
  // compare conference
  const conference = homeConf === awayConf ? homeConf : 'SB';
  // set conference
  return conference;
}

function pullSeedAndRecord(season, hnn, vnn) {
  if (!season) return;
  const homeTeam = nflTeams.find(team => team.franchise === hnn);
  const awayTeam = nflTeams.find(team => team.franchise === vnn);

  const seedAndRecords = {
    homeTeamSeed: homeTeam.seed[`yr${season}`],
    homeTeamRecord: homeTeam.record[`yr${season}`],
    awayTeamSeed: awayTeam.seed[`yr${season}`],
    awayTeamRecord: awayTeam.record[`yr${season}`]
  };

  return seedAndRecords;
}

function calcGameTime(eid, time) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const year = parseFloat(eid.substring(0, 4));
  const month = parseFloat(eid.substring(4, 6)) - 1;
  const day = parseFloat(eid.substring(6, 8));
  const [hours, minutes] = time.split(':').map(parseFloat);
  const militaryHours = hours + 12;
  const dateString = `${
    monthNames[month]
  } ${day}, ${year} ${militaryHours}:${minutes}:00 GMT-05:00`;
  const gameTime = new Date(dateString);
  return gameTime.toISOString();
}

exports.loadGames = async (req, res, next) => {
  const { season, week } = req.body;
  if (!season || !week) {
    req.flash('info', 'No Season or Week');
    res.redirect('back');
  }
  const xmlGames = await fetch(
    `http://static.nfl.com/ajax/scorestrip?season=${season}&seasonType=POST&week=${week}`
  ).then(data => data.text());

  const promiseParseString = promisify(parseString);
  const parsedJSResult = await promiseParseString(xmlGames).then(data => data);
  // console.log(parsedJSResult);
  if (!parsedJSResult.ss) {
    req.flash('error', 'No Games to Update');
    return res.redirect('back');
  }
  const uglyGames = parsedJSResult.ss.gms[0].g;

  const buildGames = uglyGames.map(game => {
    const { eid, q, h, hnn, hs, v, vnn, vs, t, gt } = game.$;
    const gameOver = q.includes('F');
    const gameTime = calcGameTime(eid, t);
    const conference = calcConference(hnn, vnn);
    const { homeTeamSeed, awayTeamSeed, homeTeamRecord, awayTeamRecord } = pullSeedAndRecord(
      season,
      hnn,
      vnn
    );
    const buildGame = {
      eid,
      season,
      week,
      gameTime,
      conference,
      homeTeamSeed,
      awayTeamSeed,
      homeTeamRecord,
      awayTeamRecord,
      homeTeamLocation: h,
      homeTeamName: capIt(hnn),
      homeTeamScore: hs,
      awayTeamLocation: v,
      awayTeamName: capIt(vnn),
      awayTeamScore: vs,
      isOver: gameOver
    };
    return buildGame;
  });

  buildGames.map(async game => {
    // update game if exists otherwise create one
    await Game.update({ eid: game.eid }, game, { upsert: true });
  });

  req.flash('success', 'Updated games ');
  res.redirect('back');
};

exports.checkAdminAccess = (req, res, next) => {
  if (
    req.user.email !== 'michael.raguso@gmail.com' ||
    req.user.email !== 'paul.raguso@gortons.com'
  ) {
    req.flash('error', 'You do not have access to view this page');
    return res.redirect('/');
  }
  next();
};
