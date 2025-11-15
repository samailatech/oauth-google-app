require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const PORT = process.env.PORT || 3002;
const app = express();

// configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use(passport.initialize());
app.use(passport.session());

// passport user serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// configure google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3002/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // In production, find/create user in DB — here we attach profile
  return done(null, { profile, accessToken, refreshToken });
}));

// routes
app.get('/', (req, res) => {
  if (!req.user) {
    return res.send(`<h2>Login with Google</h2><a href="/auth/google">Sign in with Google</a>`);
  }
  res.send(`<h2>Welcome</h2><pre>${JSON.stringify(req.user.profile, null, 2)}</pre><a href="/logout">Logout</a>`);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: true })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // successful auth
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {});
  req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => console.log(`OAuth demo running at http://localhost:${PORT}`));
