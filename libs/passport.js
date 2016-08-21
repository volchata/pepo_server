var config = require('../conf'),
    passport = require('passport'),
    User = require('../models/user').User,
    FacebookStrategy = require('passport-facebook').Strategy,
    VKontakteStrategy  = require('passport-vkontakte').Strategy;
 

var callbackUrlPrefix = 'http://'+config.get('server:host') + ':' + config.get('server:port')

passport.use(new FacebookStrategy({
        clientID: config.get("auth:fb:app_id"),
        clientSecret: config.get("auth:fb:secret"),
        callbackURL: callbackUrlPrefix+"/auth/fb/callback",
        profileFields: [
            'id',
            'displayName',
        ]
    },
    function(accessToken, refreshToken, profile, done) {
        //check user table for anyone with a fb ID of profile.id
        User.findOne({
            $and: [{'socialNetworkId': profile.id}, {'provider': "fb"}]
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from FB
            if (!user) {
                user = new User({
                    displayName: profile.displayName,
                    socialNetworkId: profile.id,
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
        callbackURL: callbackUrlPrefix+"/auth/vk/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        //check user table for anyone with a vk ID of profile.id
        User.findOne({
            $and: [{'socialNetworkId': profile.id}, {'provider': "vk"}]
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from VK
            if (!user) {
                user = new User({
                    displayName: profile.displayName,
                    socialNetworkId: profile.id,
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

