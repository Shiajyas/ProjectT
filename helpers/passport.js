const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/userSchema");
const { v4: uuidv4 } = require("uuid");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true,
    scope: ['email', 'profile'] // Include 'profile' scope
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google authentication callback reached.');
        // console.log('Profile:', profile);
        const referralCode = uuidv4();
        console.log(referralCode, "<<<<<<<<<<<<<referral is");

        // Find or create user in the database
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                referralCode: referralCode
                // Add other fields as necessary
            });
            await user.save();
        }

        req.session.user = user._id; // Set the session user ID
        console.log(req.session.user, "<<<<<<<<<<<<<user is set in session");
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
      const user = await User.findById(id);
      // console.log("Deserialized user:", user);
  
      done(null, user);
  } catch (err) {
      console.error("Error deserializing user:", err);
      done(err, null);
  }
});


module.exports = passport;
