const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const validators = require("../validators");
const validatorMiddleware = require("../middlewares/validators");
const router = express.Router();

router.post('/login', validatorMiddleware(validators.loginSchema), authController.loginUser);
router.post('/register', validatorMiddleware(validators.registerSchema), authController.registerUser);


// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Issue token, redirect or respond with user
    res.json({ token: generateToken(req.user), user: returnUser(req.user) });
  }
);

// Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  (req, res) => {
    res.json({ token: generateToken(req.user), user: returnUser(req.user) });
  }
);

// Twitter
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login', session: false }),
  (req, res) => {
    res.json({ token: generateToken(req.user), user: returnUser(req.user) });
  }
);

module.exports = router;