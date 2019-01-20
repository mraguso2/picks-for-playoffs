const mongoose = require('mongoose');
const promisify = require('es6-promisify');

const User = mongoose.model('User');
const Game = mongoose.model('Game');
const Pick = mongoose.model('Pick');

exports.home = (req, res) => {
  res.render('index', { title: 'Home' });
};

function splitGames(games, week, conference) {
  const filteredGames = games.filter(game => game.week === week && game.conference === conference);
  // sort by earliest time
  const sortedGames = filteredGames.sort((a, b) => (a.gameTime < b.gameTime ? -1 : 1));
  return sortedGames;
}

exports.bracket = (req, res) => {
  const { year } = req.params;
  const { wildcard, division, conference, superbowl } = res.locals.games;
  const { userScore } = res.locals;
  // const { sb, afc, nfc, wildcard, division, conference, superbowl } = res.locals.games;
  // res.json({ wildcard, division, conference, superbowl });
  res.render('bracket', {
    title: 'Game Time',
    userScore,
    wildcard,
    division,
    conference,
    superbowl,
    year
  });
};

function calcScore(games) {
  const gamesOver = games.filter(game => game.isOver);
  const userScore = games
    .filter(game => game.isOver && game.picks[0])
    .reduce((score, game) => {
      // grab user selections
      const teamPicked = game.picks[0] && game.picks[0].winningTeamPick;
      const totalPointsPicked = game.picks[0] && game.picks[0].totalGameScore;

      const winningScore = Math.max(game.homeTeamScore, game.awayTeamScore);
      const winningTeam =
        game.homeTeamScore === winningScore ? game.homeTeamName : game.awayTeamName;

      // set total finished games
      score.finishedGames = gamesOver.length;
      // calc correct # of teams
      if (teamPicked) {
        if (winningTeam === teamPicked) {
          if (score.correctPick === undefined) {
            score.correctPick = 1;
          } else {
            score.correctPick += 1;
          }
        }
      }

      const actualTotalScore = game.homeTeamScore + game.awayTeamScore;
      // calc points guess difference
      if (totalPointsPicked !== undefined) {
        const actualGuessDiff = Math.abs(totalPointsPicked - actualTotalScore);
        if (!score.pointsDiff) {
          score.pointsDiff = {};
        }
        switch (actualGuessDiff) {
          case 0:
            score.pointsDiff.off0 = score.pointsDiff.off0
              ? score.pointsDiff.off0 + 1
              : (score.pointsDiff.off0 = 1);
            break;
          case 1:
            score.pointsDiff.off1 = score.pointsDiff.off1
              ? score.pointsDiff.off1 + 1
              : (score.pointsDiff.off1 = 1);
            break;
          case 2:
            score.pointsDiff.off2 = score.pointsDiff.off2
              ? score.pointsDiff.off2 + 1
              : (score.pointsDiff.off2 = 1);
            break;
          case 3:
          case 4:
            score.pointsDiff.off34 = score.pointsDiff.off34
              ? score.pointsDiff.off34 + 1
              : (score.pointsDiff.off34 = 1);
            break;
          case 5:
          case 6:
          case 7:
            score.pointsDiff.off57 = score.pointsDiff.off57
              ? score.pointsDiff.off57 + 1
              : (score.pointsDiff.off57 = 1);
            break;
          default:
            break;
        }
      }
      return score;
    }, {});
  return userScore;
}

exports.getGames = async (req, res, next) => {
  // 1. query Games from that year and send to bracket page
  const { year } = req.params;
  const games = await Game.find({ season: year })
    .populate({
      path: 'picks',
      match: { picker: req.user._id }
    })
    .exec();

  games.map(async game => {
    const now = Date.now();
    const gameTime = new Date(`"${game.gameTime}"`);
    const gameStarted = gameTime.getTime() - now <= 0;
    if (game.gameStarted !== gameStarted) {
      game.gameStarted = gameStarted;
      const updatedGame = await game.save();
      return updatedGame;
    }
    return game;
  });

  const userScore = calcScore(games);
  res.locals.userScore = userScore;

  const mappedGames = {
    wildcard: {},
    division: {},
    conference: {},
    superbowl: {}
  };

  mappedGames.wildcard.AFC = splitGames(games, '18', 'AFC');
  mappedGames.wildcard.NFC = splitGames(games, '18', 'NFC');
  mappedGames.division.AFC = splitGames(games, '19', 'AFC');
  mappedGames.division.NFC = splitGames(games, '19', 'NFC');
  mappedGames.conference.AFC = splitGames(games, '20', 'AFC');
  mappedGames.conference.NFC = splitGames(games, '20', 'NFC');
  mappedGames.superbowl.SB = splitGames(games, '22', 'SB');
  // res.json({ mappedGames });
  res.locals.games = mappedGames;
  next();
};

exports.isGameLocked = async (req, res, next) => {
  // const year = req.params.year;
  const eid = req.params.game;
  if (!eid) {
    req.flash('error', 'Made a pick on an invalid game');
    return res.redirect('back');
  }

  const gameDetails = await Game.find({ eid });

  // double check if past game start
  const now = Date.now();
  const gameTime = new Date(`"${gameDetails[0].gameTime}"`);
  const gameStarted = gameTime.getTime() - now < 0;

  if (!gameDetails || gameDetails.isOver || gameDetails.gameStarted || gameStarted) {
    req.flash('error', "You can't pick on a game past its start time");
    // return res.redirect(`/bracket/${year}`);
    return res.json({ action: 'invalid' });
  }

  next();
};

exports.pickWinner = async (req, res) => {
  // find game
  const eid = req.params.game;
  const gameDetails = await Game.find({ eid });
  const gameId = gameDetails[0]._id;

  // confirm user
  if (!req.user) {
    req.flash('error', 'You need to be logged in to make a pick');
    return res.redirect('/');
  }

  // build the pick
  const newPick = {
    winningTeamPick: req.params.team,
    picker: req.user._id,
    game: gameId,
    modified: Date.now()
  };

  // either update pick or add new one
  await Pick.update({ game: gameId, picker: req.user._id }, newPick, { upsert: true });

  // send back gameDets
  res.json({ gameDetails });
};

exports.pickScore = async (req, res) => {
  // 1. find game
  const eid = req.params.game;
  const gameDetails = await Game.find({ eid });
  const gameId = gameDetails[0]._id;

  // 2. confirm user
  if (!req.user) {
    req.flash('error', 'You need to be logged in to make a pick');
    return res.redirect('/');
  }
  // build the pick
  const newPick = {
    totalGameScore: Math.round(req.params.score),
    picker: req.user._id,
    game: gameId,
    modified: Date.now()
  };

  // either update pick or add new one
  await Pick.update({ game: gameId, picker: req.user._id }, newPick, { upsert: true });

  // send back gameDets
  res.json({ gameDetails });
};

exports.userScore = async (req, res) => {
  const games = await Game.calcUserScore(req.user, '2018');
  res.json(games);
};
