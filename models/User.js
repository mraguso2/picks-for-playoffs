const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  firstName: {
    type: String,
    required: 'Please supply a first name',
    trim: true
  },
  lastName: {
    type: String,
    required: 'Please supply a last name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// creating a virtual field, gravatar
userSchema.virtual('gravatar').get(function getGravatar() {
  // this = user
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

// set options: usernameField to the "email" vs default "username"
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
