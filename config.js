require('dotenv').config();

module.exports = {
  sessionSecret: process.env.SESSION_SECRET,
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    
    username: process.env.GITHUB_USERNAME
  },
  youtube: {
    channelId: process.env.YOUTUBE_CHANNEL_ID
  }
};