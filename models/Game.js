const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const gameSchema = new mongoose.Schema(
  {
    eid: {
      type: String,
      trim: true
    },
    homeTeamLocation: {
      type: String,
      trim: true
    },
    homeTeamName: {
      type: String,
      trim: true
    },
    homeTeamScore: {
      type: Number
    },
    homeTeamSeed: {
      type: Number
    },
    homeTeamRecord: {
      type: String
    },
    awayTeamLocation: {
      type: String,
      trim: true
    },
    awayTeamName: {
      type: String,
      trim: true
    },
    awayTeamScore: {
      type: Number
    },
    awayTeamSeed: {
      type: Number
    },
    awayTeamRecord: {
      type: String
    },
    isOver: {
      type: Boolean
    },
    gameStarted: {
      type: Boolean
    },
    season: {
      type: String
    },
    week: {
      type: String
    },
    conference: {
      type: String
    },
    gameTime: {
      type: Date
    },
    created: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date
    }
  },
  {
    // virtuals are there but not shown, we explicitly bring virtuals along below
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

gameSchema.statics.calcUserScore = function(user, year) {
  return this.aggregate([
    // Lookup games and populate their picks
    // for the from mongodb will lowercase your model and add an "s" to the end Pick = picks
    { $lookup: { from: 'picks', localField: '_id', foreignField: 'game', as: 'picks' } }, // adds propery reviews from "as"
    // filter for only items that have 2 or more reviews
    {
      $match: {
        $and: [
          { 'picks.0': { $exists: true } },
          // { isOver: { $eq: true } },
          { season: { $eq: year } }
        ]
      }
    }
  ]);
};

gameSchema.virtual('picks', {
  ref: 'Pick', // what model to link?
  localField: '_id', // which field on the game?
  foreignField: 'game' // which field on the pick?
});

function autopopulate(next) {
  this.populate({ path: 'picks', match: { _id: user._id } }); // populate the picks prop
  next();
}

function gameStatus(next) {
  console.log(this);
  const now = Date.now();
  const gameTime = new Date(`"${this.gameTime}"`);
  const gameStarted = gameTime.getTime() - now <= 0;
  console.log(gameStarted);
  this.gameStarted = gameStarted;
  next();
}

// gameSchema.pre('init', gameStatus);
// gameSchema.pre('find', gameStatus);
gameSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Game', gameSchema);
