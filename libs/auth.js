var config = require('../conf'),
    passport = require('passport'),
    User = require('../models/user').User,
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
    function(accessToken, refreshToken, profile, done) {
        //check user table for anyone with a fb ID of profile.id
        User.findOne({
            'userID': profile.id 
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from FB
            if (!user) {
                user = new User({
                    userName: profile.displayName,
                    userID: profile.id,
                    provider: 'fb'
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
));
 
passport.use(new VKontakteStrategy ({
        clientID: config.get("auth:vk:app_id"),
        clientSecret: config.get("auth:vk:secret"),
        callbackURL: "http://localhost:8080/auth/vk/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        //check user table for anyone with a vk ID of profile.id
        User.findOne({
            'userID': profile.id 
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from VK
            if (!user) {
                user = new User({
                    userName: profile.displayName,
                    userID: profile.id,
                    provider: 'vk'
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
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
