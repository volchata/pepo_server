var config = require('../conf'),
    passport = require('passport'),
    User = require('../models/user').User,
    FacebookStrategy = require('passport-facebook').Strategy,
    VKontakteStrategy  = require('passport-vkontakte').Strategy;

function authenticate(accessToken, refreshToken, profile, done) {
    //check user table for anyone with a fb ID of profile.id
    User.findOne({
        $and: [{'socialNetworkId': profile.id}, {'provider': profile.provider}]
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        //No user was found... so create a new user with values from FB
        if (!user) {
            user = new User({
                displayName: profile.provider +'_'+ profile.id,
                socialNetworkId: profile.id,
                provider: profile.provider
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
 

var callbackUrlPrefix = 'http://'+config.get('server:host');
(function(){
    var port = +(config.get('server:portCallback'));
    if ( (typeof port === 'number') && (port != 80) ) {
        callbackUrlPrefix += ':' + port;
    }
})()


passport.use(new FacebookStrategy({
        clientID: config.get("auth:fb:app_id"),
        clientSecret: config.get("auth:fb:secret"),
        callbackURL: callbackUrlPrefix+"/auth/fb/callback",
        profileFields: [
            'id',
            'displayName'
        ]
    },
    authenticate
    
));
 
passport.use(new VKontakteStrategy ({
        clientID: config.get("auth:vk:app_id"),
        clientSecret: config.get("auth:vk:secret"),
        callbackURL: callbackUrlPrefix+"/auth/vk/callback"
    },
    authenticate
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});


passport.deserializeUser(function(id, done) {
    User.findById(id, function(err,user){
        err
            ? done(err)
            : done(null,user);
    });
});


module.exports = passport;

