var config = require('../conf'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    VKontakteStrategy  = require('passport-vkontakte').Strategy;
 
passport.use(new FacebookStrategy({
        clientID: config.get("auth:fb:app_id"),
        clientSecret: config.get("auth:fb:secret"),
        callbackURL: "http://localhost:8080/auth/fb/callback",
        profileFields: [
            'id',
            'displayName',
        ]
    },
    function (accessToken, refreshToken, profile, done) { 
        return done(null, {
            username: profile.displayName
        });
    }
));
 
passport.use(new VKontakteStrategy ({
        clientID: config.get("auth:vk:app_id"),
        clientSecret: config.get("auth:vk:secret"),
        callbackURL: "http://localhost:8080/auth/vk/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        return done(null, {
            username: profile.displayName,
            photoUrl: profile.photos[0].value,
            profileUrl: profile.profileUrl
        });
    }
));
 
passport.serializeUser(function (user, done) {
    done(null, JSON.stringify(user));
});
 
 
passport.deserializeUser(function (data, done) {
    try {
        done(null, JSON.parse(data));
    } catch (e) {
        done(err)
    }
});
 
module.exports = passport;
