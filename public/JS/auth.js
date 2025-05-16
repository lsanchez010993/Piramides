import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync('private/credentials.json'));

passport.use(new GoogleStrategy({
    clientID: credentials.client_id,
    clientSecret: credentials.client_secret,
    callbackURL: "http://localhost:8081/google/callback"
}, function (accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));

// Serializar y deserializar usuario (necesario para sesiones)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
