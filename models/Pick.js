const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const pickSchema = new mongoose.Schema({
  winningTeamPick: {
    type: String
  },
  totalGameScore: {
    type: Number
  },
  created: {
    type: Date,
    default: Date.now
  },
  picker: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply a user!'
  },
  game: {
    type: mongoose.Schema.ObjectId,
    ref: 'Game',
    required: 'You must supply a game!'
  },
  modified: {
    type: Date
  }
});

function autopopulate(next) {
  this.populate('picker');
  next();
}

pickSchema.pre('find', autopopulate);
pickSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Pick', pickSchema);
