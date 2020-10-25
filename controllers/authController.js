const passport = require('passport');
const crypto = require('crypto');

const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in'
});

exports.logout = (req, res, next) => {
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next(); // carry on! They are logged in!
    return;
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email'); // don't tell them no email in prod - security flaw - could just say "sent email reset to that email"
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expiry on their account - values saved to user model
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  // console.log(resetURL);
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });
  req.flash('success', 'You have been emailed a password reset link.');
  // 4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // check the token is greater than now - $gt mongo fn
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset password form
  res.render('reset', { title: 'Reset Your Password' });
};

// more user friendly to in addition let user know if not match right in UI
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    // need brackets bc dash in obj prop
    next(); // keep it going
    return;
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // check the token
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // made available to us and bind setPassword to user
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  // need to remove token and expiry
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // save user to db
  const updatedUser = await user.save();

  // .login coming from passport - made available to us
  await req.login(updatedUser);

  req.flash('success', '🎊 Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
};
