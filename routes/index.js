const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');
const adminController = require('../controllers/adminController');

// fn composition to handle errors with asnyc/await
const { catchErrors } = require('../handlers/errorHandlers');

/**
 * Landing and Home Page
 */
router.get('/', gameController.home);

/**
 * login and logout
 */
router.get('/login', userController.loginForm);
router.get('/forgot', userController.forgotForm);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

/**
 * register
 */
router.get('/register', userController.registerForm);

// 1. Validate the registration data ~ 2. register the user ~ 3. we need to log them in
router.post(
  '/register',
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);

/**
 * account
 */
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

/**
 * bracket
 */
router.get(
  '/bracket/:year',
  authController.isLoggedIn,
  catchErrors(gameController.getGames),
  gameController.bracket
);

// get fakegames
// this is just to show the user/anyone interested in what it looks like (flaws in how it all works)
router.get('/fakebracket/:postWeek', gameController.getFakeGames, gameController.bracket);

router.get('/top', gameController.top);
router.get('/how-to-play', gameController.rules);

/**
 * admin
 */
router.get('/admin', adminController.checkAdminAccess, adminController.home);

//* **** */ admin API
router.post('/api/v1/loadGames', catchErrors(adminController.loadGames));

/**
 * API
 */

router.post(
  '/api/v1/pickWinner/:year/:game/:team',
  catchErrors(gameController.isGameLocked),
  catchErrors(gameController.pickWinner)
);

router.post(
  '/api/v1/pickScore/:year/:game/:score',
  catchErrors(gameController.isGameLocked),
  catchErrors(gameController.pickScore)
);

module.exports = router;
