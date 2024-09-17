const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
const config = require('./config');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Check YouTube subscription status
    checkYouTubeSubscription(accessToken, config.youtube.channelId)
      .then(isSubscribed => {
        profile.isSubscribed = isSubscribed;
        done(null, profile);
      })
      .catch(error => done(error));
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Check GitHub follow status
    checkGitHubFollow(accessToken, config.github.username)
      .then(isFollowing => {
        profile.isFollowing = isFollowing;
        done(null, profile);
      })
      .catch(error => done(error));
  }
));

// Routes
app.get('/auth/google', (req, res, next) => {
    console.log('Received request for /auth/google');
    passport.authenticate('google', { scope: ['profile', 'https://www.googleapis.com/auth/youtube.force-ssl'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
    console.log('Received callback from Google');
    passport.authenticate('google', { failureRedirect: '/login' })(req, res, (err) => {
        if (err) return next(err);
        console.log('User authenticated:', req.user);
        if (req.user.isSubscribed) {
            res.redirect('/success');
        } else {
            res.redirect('/subscribe');
        }
    });
});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:follow'] }));
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user.isFollowing) {
      res.redirect('/success');
    } else {
      res.redirect('/follow');
    }
  }
);

app.get('/success', (req, res) => {
  res.send('SUCCESSFULLY ENTERED HERE');
});

app.get('/subscribe', (req, res) => {
  res.send('SUBSCRIBE TO THE CHANNEL PLEASE');
});

app.get('/follow', (req, res) => {
  res.send('FOLLOW ME ON GITHUB');
});

// Helper functions
async function checkYouTubeSubscription(userId, accessToken) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID.replace('@', ''); // Clean up '@'

  try {
      // Fetch the user's subscriptions using the access token and check for the channel ID directly
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/subscriptions`, {
          params: {
              part: 'snippet',
              forChannelId: channelId, // This specifies the channel we are looking for
              mine: true,              // Check for authenticated user's subscriptions
              key: apiKey
          },
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });

      // If there are items in the response, the user is subscribed to the channel
      if (response.data.items && response.data.items.length > 0) {
          return true;
      }

      return false; // User is not subscribed
  } catch (error) {
      console.error('Error checking YouTube subscription:', error.response ? error.response.data : error);
      return false;
  }
}



async function checkGitHubFollow(accessToken, username) {
  try {
    const response = await axios.get(`https://api.github.com/user/following/${username}`, {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });
    return response.status === 204;
  } catch (error) {
    console.error('Error checking GitHub follow:', error);
    return false;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));