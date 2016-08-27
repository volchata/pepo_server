'use strict';

module.exports = {
    currentUser: require('./mUser').currentUser,
    limitData: require('./mUser').limitData,
    users: require('./users'),
    user: require('./user'),
    auth: require('./auth'),
    cors: require('./cors'),
    tweet: require('./tweetAPI')
};
