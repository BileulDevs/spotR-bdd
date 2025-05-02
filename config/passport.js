const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const User = require('../models/user');

module.exports = (passport) => {
  // Google
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0].value,
            googleId: profile.id
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));

  // Facebook
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'displayName']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0]?.value,
            facebookId: profile.id
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));

  // Twitter (OAuth2)
  passport.use(new TwitterStrategy({
      clientID: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: '/auth/twitter/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.username,
            twitterId: profile.id
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));

  // For session support
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => User.findById(id, done));
};